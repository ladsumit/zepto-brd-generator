"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

type Comment = {
  id: string;
  content: string;
  createdBy: string;
  createdAt: any; // Replace `any` with a proper Firestore timestamp type if available
};

interface BRDDetails {
  content: string;
  title?: string;
  goals?: string;
  features?: string;
}

export default function SharePage() {
  const [brdDetails, setBrdDetails] = useState<BRDDetails | null>(null); // Store full BRD details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Comment[]>([]); // Store comments
  const [newComment, setNewComment] = useState(""); // Store new comment input
  const params = useParams(); // Retrieve parameters from the URL
  const id = params?.id as string | undefined; // Ensure `id` is correctly typed and can be undefined
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser); // Track current user state

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Update user state on login/logout
    });
    return () => unsubscribe();
  }, []);
  
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
          })) as Comment[]; // Type assertion for comments
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
      const createdBy = user?.email || "Anonymous"; // Fallback to "Anonymous"
  
      if (!brdId || !user) {
        throw new Error("User must be logged in to add a comment");
      }
  
      const commentData: Omit<Comment, "id"> = {
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
  
  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null); // Clear user state
      router.push(`/login?redirect=/share/${id}`); // Redirect to login
    } catch (error) {
      console.error("Error logging out:", error);
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
        <div className="flex justify-between items-center">
          <p>Welcome, {user ? user.email : "Guest"}</p>
          {user && (
            <button
              onClick={logout}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold"
            >
              Logout
            </button>
          )}
        </div>
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
          {user ? (
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
          ) : (
            <p className="text-center text-blue-500 mt-4">
              <a href={`/login?redirect=/share/${id}`}>Login to add a comment</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
