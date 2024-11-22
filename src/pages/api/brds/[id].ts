import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    const docRef = doc(db, "brds", id as string);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "BRD not found" });
    }

    res.status(200).json(docSnap.data());
  } catch (error) {
    console.error("Error fetching BRD:", error);
    res.status(500).json({ error: "Failed to fetch BRD" });
  }
}
