import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase"; // Import Firestore instance
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only accept POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    const { productName, goals, features } = req.body;

    if (!productName || !goals) {
        return res.status(400).json({ error: "Missing required fields: productName or goals" });
    }

    // Construct the OpenAI prompt
    const prompt = `Generate a Product Requirements Document (PRD) based on the following details:
        - Product Name: ${productName}
        - Goals: ${goals}
        - Features: ${features || "No specific features provided"}

        The PRD should include:
        1. An executive summary.
        2. Key objectives.
        3. Functional requirements.
        4. High-level project risks or assumptions.
        Make the document concise, professional, and tailored for a technical and business audience.`;

    try {
        // Call OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Switch to "gpt-4" if needed
                messages: [
                    { role: "system", content: "You are a helpful assistant specialized in writing BRDs." },
                    { role: "user", content: prompt },
                ],
                max_tokens: 500, // Adjust token limit for longer outputs
                temperature: 0.7, // Adjust temperature for creative vs deterministic responses
            }),
        });

        const data = await response.json();
        console.log("OpenAI Response:", data);

        // Validate response
        if (!data.choices || data.choices.length === 0) {
            return res.status(500).json({ error: "No choices returned from OpenAI API" });
        }

        const cleanContent = removeMarkdown(data.choices[0].message.content.trim());

        // NEW: Save the BRD to Firestore
        const brdsCollection = collection(db, "brds");
        const docRef = await addDoc(brdsCollection, {
            productName,
            goals,
            features: features || "No specific features provided",
            content: cleanContent,
            createdAt: new Date(),
        });

        // NEW: Return both the BRD content and its unique ID
        res.status(200).json({ brdId: docRef.id, brd: cleanContent });
    } catch (error) {
        console.error("Error generating BRD:", error);
        res.status(500).json({ error: "Failed to generate BRD" });
    }
}

// Helper function to clean up Markdown-like syntax
function removeMarkdown(text: string): string {
    return text.replace(/[#*`_~>]/g, "").trim();
}
