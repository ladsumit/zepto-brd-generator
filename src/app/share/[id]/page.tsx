"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";

export default function SharePage() {
  const [brdDetails, setBrdDetails] = useState(null); // Store full BRD details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]); // Store comments
  const [newComment, setNewComment] = useState(""); // Store new comment input
  const { id } = useParams(); // Get the share ID from URL

  useEffect(() => {
    const fetchShareDetails = async () => {
      try {
        // Fetch share details using the shareId
        const shareRes = await fetch(`/api/share?id=${id}`);
        if (!shareRes.ok) {
          throw new Error("Failed to fetch share details");
        }
        const shareData = await shareRes.json();

        // Use the retrieved brdId to fetch the actual BRD details
        const brdRes = await fetch(`/api/brds/${shareData.brdId}`);
        if (!brdRes.ok) {
          throw new Error("Failed to fetch BRD details");
        }
        const brdData = await brdRes.json();
        setBrdDetails(brdData);

        // Listen to real-time comments for the BRD
        const commentsRef = collection(db, "brds", shareData.brdId, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const commentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(commentsData);
        });

        return () => unsubscribe(); // Clean up listener
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchShareDetails();
  }, [id]);

  const addComment = async () => {
    if (!newComment.trim()) return; // Avoid adding empty comments

    try {

      // Fetch share details using the shareId
      const shareRes = await fetch(`/api/share?id=${id}`);
      if (!shareRes.ok) {
        throw new Error("Failed to fetch share details");
      }
      const shareData = await shareRes.json();

      // Use the BRD ID and authenticated user
      const brdId = shareData.brdId;
      const userId = auth.currentUser?.uid;
      const createdBy = auth.currentUser?.email;

      if (!brdId || !userId) {
        throw new Error("Missing BRD ID or user information");
      }

      const commentData = {
        content: newComment,
        createdBy,
        createdAt: serverTimestamp(),
      };

      // Add the comment to Firestore
      const commentsRef = collection(db, "brds", brdId, "comments");
      await addDoc(commentsRef, commentData);

      // Clear the comment input
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment. Please try again.");
    }
  };

  
  

  if (loading) {
    return <div className="text-center text-lg">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-cardBg p-6 rounded-lg shadow-lg">
      <p>Welcome, {auth.currentUser?.email}</p>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text mb-4">
          Shared BRD
        </h1>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-textPrimary">BRD Details</h2>
          <p className="mt-2 whitespace-pre-line text-textSecondary">
            {brdDetails?.content || "No content available"}
          </p>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Comments</h2>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-background p-4 rounded-lg shadow">
                <p className="text-sm text-textSecondary">{comment.createdBy}</p>
                <p className="text-textPrimary">{comment.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <textarea
              className="w-full px-4 py-2 bg-background border border-textSecondary rounded text-textPrimary"
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={addComment}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full mt-2 py-2 px-4 rounded-lg font-semibold"
            >
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
