import type { NextApiRequest, NextApiResponse } from "next";

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
    const prompt = `Generate a Business Requirements Document (BRD) based on the following details:
        - Product Name: ${productName}
        - Goals: ${goals}
        - Features: ${features || "No specific features provided"}

        The BRD should include:
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

        // Return the generated BRD
        res.status(200).json({ brd: data.choices[0].message.content.trim() });
    } catch (error) {
        console.error("Error generating BRD:", error);
        res.status(500).json({ error: "Failed to generate BRD" });
    }
}
