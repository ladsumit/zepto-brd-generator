import { NextApiRequest, NextApiResponse } from "next";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { brdId, content, createdBy } = req.body;

    if (!brdId || !content || !createdBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const commentsRef = collection(db, "brds", brdId, "comments");

    const newComment = {
      content,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(commentsRef, newComment);

    return res.status(200).json({ id: docRef.id, ...newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ error: "Failed to add comment" });
  }
}
