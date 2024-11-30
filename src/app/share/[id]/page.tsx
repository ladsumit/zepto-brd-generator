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
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

type Comment = {
  id: string;
  content: string;
  createdBy: string;
  createdAt: any;
};

interface BRDDetails {
  content: string;
  title?: string;
  goals?: string;
  features?: string;
}

export default function SharePage() {
  const [brdDetails, setBrdDetails] = useState<BRDDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [isEditing, setIsEditing] = useState(false); // Tracks BRD editing state
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch BRD details and comments
  useEffect(() => {
    const fetchShareDetails = async () => {
      try {
        if (!id) throw new Error("Share ID is missing");

        // Fetch share details
        const shareRes = await fetch(`/api/share?id=${id}`);
        if (!shareRes.ok) throw new Error("Failed to fetch share details");
        const shareData = await shareRes.json();

        // Fetch BRD details
        const brdRes = await fetch(`/api/brds/${shareData.brdId}`);
        if (!brdRes.ok) throw new Error("Failed to fetch BRD details");
        const brdData = await brdRes.json();

        setBrdDetails(brdData);

        // Fetch comments
        const commentsRef = collection(db, "brds", shareData.brdId, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const commentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Comment[];
          setComments(commentsData);
        });

        return () => unsubscribe();
      } catch (err: any) {
        console.error("Error fetching details:", err.message);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchShareDetails();
  }, [id]);

  // Save updated BRD details
  const saveEdits = async () => {
    if (!brdDetails || !id) return;

    try {
      const shareRes = await fetch(`/api/share?id=${id}`);
      if (!shareRes.ok) throw new Error("Failed to fetch share details");
      const shareData = await shareRes.json();
      const brdDocRef = doc(db, "brds", shareData.brdId);

      await updateDoc(brdDocRef, {
        content: brdDetails.content,
        title: brdDetails.title || "",
        goals: brdDetails.goals || "",
        features: brdDetails.features || "",
      });

      setIsEditing(false); // Exit edit mode
    } catch (err) {
      console.error("Error saving edits:", err);
      setError("Failed to save edits. Please try again.");
    }
  };

  // Add a new comment
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const shareRes = await fetch(`/api/share?id=${id}`);
      if (!shareRes.ok) throw new Error("Failed to fetch share details");
      const shareData = await shareRes.json();

      const brdId = shareData.brdId;
      const createdBy = user?.email || "Anonymous";

      const commentData: Omit<Comment, "id"> = {
        content: newComment,
        createdBy,
        createdAt: serverTimestamp(),
      };

      const commentsRef = collection(db, "brds", brdId, "comments");
      await addDoc(commentsRef, commentData);

      setNewComment(""); // Clear input
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment. Please try again.");
    }
  };

  // Edit a comment
  const saveEditedComment = async () => {
    if (!editCommentId || !editCommentContent.trim()) return;

    try {
      const shareRes = await fetch(`/api/share?id=${id}`);
      if (!shareRes.ok) throw new Error("Failed to fetch share details");
      const shareData = await shareRes.json();

      const brdId = shareData.brdId;
      const commentDocRef = doc(db, "brds", brdId, "comments", editCommentId);

      await updateDoc(commentDocRef, { content: editCommentContent });

      setEditCommentId(null);
      setEditCommentContent("");
    } catch (err) {
      console.error("Error editing comment:", err);
      setError("Failed to edit comment. Please try again.");
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    try {
      const shareRes = await fetch(`/api/share?id=${id}`);
      if (!shareRes.ok) throw new Error("Failed to fetch share details");
      const shareData = await shareRes.json();

      const brdId = shareData.brdId;
      const commentDocRef = doc(db, "brds", brdId, "comments", commentId);

      await deleteDoc(commentDocRef);
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push(`/login?redirect=/share/${id}`);
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

  const viewUserStories = async () => {
    try{
      const shareRes = await fetch(`/api/share?id=${id}`);
      if (!shareRes.ok) throw new Error("Failed to fetch share details");
      const shareData = await shareRes.json();
      const brdId = shareData.brdId;
      if(!brdId) {
        console.error("BRD id is missing");
        return;
      }
      router.push(`/userstories/${brdId}`);
    } catch (err) {
      console.error("Error Viewing User Stories:", err);
      setError("Failed to View User Stories. Please try again.");
    }
  };

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
          Shared Product Requirements
        </h1>
        {brdDetails && (
          <div className="mb-4">
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold text-textPrimary">Product Requirements Document</h2>
              {user && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-500 underline"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              )}
            </div>
            {isEditing ? (
              <div>
                <textarea
                  className="w-full mt-2 p-2 bg-background border border-textSecondary rounded text-textPrimary"
                  rows={5}
                  value={brdDetails.content}
                  onChange={(e) =>
                    setBrdDetails({ ...brdDetails, content: e.target.value })
                  }
                />
                <button
                  onClick={saveEdits}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 mt-2 rounded-lg font-semibold"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-line text-textSecondary">
                {brdDetails.content || "No content available"}
              </p>
            )}
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Comments</h2>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-background p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <p className="text-sm text-textSecondary">{comment.createdBy}</p>
                  {user?.email === comment.createdBy && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditCommentId(comment.id);
                          setEditCommentContent(comment.content);
                        }}
                        className="text-blue-500 underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-red-500 underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                {editCommentId === comment.id ? (
                  <div>
                    <textarea
                      className="w-full mt-2 p-2 bg-background border border-textSecondary rounded text-textPrimary"
                      rows={2}
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                    />
                    <button
                      onClick={saveEditedComment}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-1 px-2 mt-2 rounded-lg font-semibold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-textPrimary">{comment.content}</p>
                )}
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
              <button
                onClick={viewUserStories}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full mt-2 py-2 px-4 rounded-lg font-semibold"
              >
                View User Stories
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
