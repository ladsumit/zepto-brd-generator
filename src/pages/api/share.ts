import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { nanoid } from "nanoid";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === "POST") {
    const { brdId, password } = req.body;

    if (!brdId || !password) {
      return res.status(400).json({ error: "Missing required fields: brdId or password" });
    }

    try {
      const shareId = nanoid(); // Generate unique ID
      await addDoc(collection(db, "shares"), {
        brdId,
        password,
        shareId,
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({
        shareableLink: `${process.env.NEXT_PUBLIC_BASE_URL}/share/${shareId}`,
      });
    } catch (error) {
      console.error("Error creating shareable link:", error);
      return res.status(500).json({ error: "Failed to create shareable link" });
    }
  }

  if (method === "GET") {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Missing or invalid share ID" });
    }

    try {
      const sharesQuery = query(collection(db, "shares"), where("shareId", "==", id));
      const shareSnapshot = await getDocs(sharesQuery);

      if (shareSnapshot.empty) {
        return res.status(404).json({ error: "Shared BRD not found" });
      }

      const shareData = shareSnapshot.docs[0].data(); // Get the first matching document
      return res.status(200).json(shareData); // Return the shared BRD data
    } catch (error) {
      console.error("Error fetching shared BRD:", error);
      return res.status(500).json({ error: "Failed to fetch shared BRD" });
    }
  }

  // Method not allowed
  res.setHeader("Allow", ["POST", "GET"]);
  return res.status(405).json({ error: `Method ${method} not allowed` });
}
