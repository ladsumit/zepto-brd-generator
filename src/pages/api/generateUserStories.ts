import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    const { brdId, goals, features } = req.body;

    if (!brdId || !goals) {
        return res.status(400).json({ error: "Missing required fields: brdId, title, or goals" });
    }

    // Construct the OpenAI prompt
    const prompt = `Generate user stories for a product based on the following details:
        - Goals: ${goals}
        - Features: ${features || "No specific features provided"}
        
        Each user story should follow this format:
        "As a [type of user], I want to [perform some action] so that [achieve a goal]."
        
        Generate 3 concise user stories.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are an expert in writing user stories for software products." },
                    { role: "user", content: prompt },
                ],
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            return res.status(500).json({ error: "No choices returned from OpenAI API" });
        }

        const userStories = data.choices[0].message.content
            .split("\n")
            .filter((story: string) => story.trim().length > 0);

        const storiesCollection = collection(db, "brds", brdId, "userstories");
        const savedStories = [];

        for (const story of userStories) {
            const docRef = await addDoc(storiesCollection, {
                content: story.trim(),
                createdAt: new Date(),
            });
            savedStories.push({ id: docRef.id, content: story.trim() });
        }

        res.status(200).json({ stories: savedStories });
    } catch (error) {
        console.error("Error generating user stories:", error);
        res.status(500).json({ error: "Failed to generate user stories" });
    }
}
