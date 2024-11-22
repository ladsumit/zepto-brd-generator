"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CollaborationPage() {
  const { id } = useParams<{ id: string }>(); // Retrieve BRD ID from URL

  // State hooks
  const [brdData, setBrdData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>(""); // State for the shareable link
  const [loading, setLoading] = useState<boolean>(false); // Loading state for sharing

  // useEffect for fetching BRD details
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
      } catch (error) {
        console.error("Error fetching BRD:", error);
        setError("Failed to fetch BRD data.");
      }
    };

    fetchBRD();
  }, [id]);

  // Function to create a shareable link
  const createShareLink = async () => {
    if (!id) {
      setError("BRD ID is required to create a shareable link.");
      return;
    }

    setLoading(true);
    setShareLink(""); // Clear any previous link
    setError("");

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brdId: id, password: "default-password" }), // Optional: Use dynamic passwords
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

  // Main UI
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-cardBg p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Collaboration Page</h1>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">BRD Details:</h2>
            <p className="text-lg">
              <strong>Title:</strong> {brdData.productName || "N/A"}
            </p>
            <p className="text-lg">
              <strong>Goals:</strong> {brdData.goals || "N/A"}
            </p>
            <p className="text-lg">
              <strong>Features:</strong> {brdData.features || "N/A"}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Full BRD:</h2>
            <p className="text-lg whitespace-pre-line">
              {brdData.content || "No content available."}
            </p>
          </div>

          {/* Share Button */}
          <div className="mt-6">
            <button
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full py-2 px-4 rounded-lg font-semibold"
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
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
