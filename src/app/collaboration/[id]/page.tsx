"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function CollaborationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  // State hooks
  const [brdData, setBrdData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isEditing, setIsEditing] = useState(false); // Track edit mode

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Function to log out the user
  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Fetch BRD details
  useEffect(() => {
    if (!id) {
      setError("No ID provided");
      return;
    }

    const fetchBRD = async () => {
      try {
        const docRef = doc(db, "brds", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBrdData(docSnap.data());
        } else {
          setError("BRD not found.");
        }
      } catch (err) {
        console.error("Error fetching BRD:", err);
        setError("Failed to fetch BRD data.");
      }
    };

    fetchBRD();
  }, [id]);

  // Save updated BRD details
  const saveEdits = async () => {
    if (!brdData || !id) return;

    try {
      const brdDocRef = doc(db, "brds", id);

      await updateDoc(brdDocRef, {
        productName: brdData.productName || "",
        goals: brdData.goals || "",
        features: brdData.features || "",
        content: brdData.content || "",
      });

      setIsEditing(false); // Exit edit mode
    } catch (err) {
      console.error("Error saving edits:", err);
      setError("Failed to save edits. Please try again.");
    }
  };

  // Function to create a shareable link
  const createShareLink = async () => {
    if (!id) {
      setError("BRD ID is required to create a shareable link.");
      return;
    }

    setLoading(true);
    setShareLink(""); // Clear any previous link
    setError("");

    if (!user) {
      router.push(`/login?redirect=/collaboration/${id}`);
      return;
    }

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brdId: id, password: "default-password" }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to generate shareable link.");
      }

      const { shareableLink } = await response.json();
      setShareLink(shareableLink);
    } catch (err: any) {
      console.error("Error generating shareable link:", err);
      setError(err.message || "Failed to generate shareable link.");
    } finally {
      setLoading(false);
    }
  };

  // Render different states
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!brdData) {
    return <div className="text-center">Loading BRD...</div>;
  }

  const viewUserStories = async () => {
    if(!id) {
      console.error("BRD id is missing");
      return;
    }
    router.push(`/userstories/${id}`);
  };

  // Main UI
  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-cardBg p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-4">Collaboration Page</h1>
          {user && (
            <button
              onClick={logout}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold"
            >
              Logout
            </button>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">BRD Details:</h2>
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
                rows={3}
                value={brdData.productName}
                onChange={(e) =>
                  setBrdData({ ...brdData, productName: e.target.value })
                }
                placeholder="Product Name"
              />
              <textarea
                className="w-full mt-2 p-2 bg-background border border-textSecondary rounded text-textPrimary"
                rows={3}
                value={brdData.goals}
                onChange={(e) => setBrdData({ ...brdData, goals: e.target.value })}
                placeholder="Goals"
              />
              <textarea
                className="w-full mt-2 p-2 bg-background border border-textSecondary rounded text-textPrimary"
                rows={3}
                value={brdData.features}
                onChange={(e) =>
                  setBrdData({ ...brdData, features: e.target.value })
                }
                placeholder="Features"
              />
              <textarea
                className="w-full mt-2 p-2 bg-background border border-textSecondary rounded text-textPrimary"
                rows={5}
                value={brdData.content}
                onChange={(e) => setBrdData({ ...brdData, content: e.target.value })}
                placeholder="Full BRD Content"
              />
              <button
                onClick={saveEdits}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 mt-2 rounded-lg font-semibold"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg">
                <strong>Title:</strong> {brdData.productName || "N/A"}
              </p>
              <p className="text-lg">
                <strong>Goals:</strong> {brdData.goals || "N/A"}
              </p>
              <p className="text-lg">
                <strong>Features:</strong> {brdData.features || "N/A"}
              </p>
              <p className="text-lg whitespace-pre-line">
                <strong>Content:</strong> {brdData.content || "No content available."}
              </p>
            </div>
          )}
        </div>

        {/* Share Button */}
        <div className="mt-6">
          <button
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full mt-2 py-2 px-4 rounded-lg font-semibold"
            onClick={createShareLink}
            disabled={loading}
          >
            {loading ? "Creating Link..." : "Generate Shareable Link"}
          </button>
          {/* Display Shareable Link */}
          {shareLink && (
            <div className="mt-4 text-center">
              <p className="text-lg font-medium">Shareable Link:</p>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                {shareLink}
              </a>
            </div>
          )}
          <button
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full mt-2 py-2 px-4 rounded-lg font-semibold"
            onClick={viewUserStories}
          >
            View User Stories
          </button>
        </div>
      </div>
    </div>
  );
}
