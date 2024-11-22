import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { brdId, comment, userId } = req.body;

  if (!brdId || !comment || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const docRef = await addDoc(collection(db, "comments"), {
      brdId,
      comment,
      userId,
      createdAt: new Date(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
}
