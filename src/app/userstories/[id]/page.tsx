"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";

type UserStory = {
  id: string;
  content: string;
  createdAt: Date;
};

type BRDDetails = {
  productName?: string;
  goals?: string;
  features?: string;
  content?: string;
};

export default function UserStoriesPage() {
  const [brdDetails, setBrdDetails] = useState<BRDDetails | null>(null); // Store BRD details
  const [userStories, setUserStories] = useState<UserStory[]>([]); // Store user stories
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStory, setNewStory] = useState(""); // For adding new user stories
  const params = useParams();
  const id = params?.id as string | undefined;
  const [user, setUser] = useState(auth.currentUser);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch BRD details and user stories
  useEffect(() => {
    if (!id) {
      setError("No ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch BRD details
        const docRef = doc(db, "brds", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("BRD not found.");
          setLoading(false);
          return;
        }

        setBrdDetails(docSnap.data() as BRDDetails);

        // Fetch real-time user stories
        const storiesRef = collection(db, "brds", id, "userstories");
        const unsubscribe = onSnapshot(storiesRef, (snapshot) => {
          const storiesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            content: doc.data().content as string,
            createdAt: doc.data().createdAt.toDate() as Date,
          })) as UserStory[];
          setUserStories(storiesData);
        });

        return () => unsubscribe();
      } catch (err: any) {
        console.error("Error fetching BRD details:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Add a new user story
  const addUserStory = async () => {
    if (!newStory.trim() || !id) return;

    try {
      const storiesRef = collection(db, "brds", id, "userstories");
      await addDoc(storiesRef, {
        content: newStory,
        createdAt: new Date(),
      });
      setNewStory(""); // Clear input
    } catch (err) {
      console.error("Error adding user story:", err);
      setError("Failed to add user story. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-cardBg p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4">User Stories</h1>

        {/* BRD Details Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Product Requirements</h2>
          <div className="mt-2">
            <p>
              <strong>Title:</strong> {brdDetails?.productName || "N/A"}
            </p>
            <p>
              <strong>Goals:</strong> {brdDetails?.goals || "N/A"}
            </p>
            <p>
              <strong>Features:</strong> {brdDetails?.features || "N/A"}
            </p>
          </div>
        </div>

        {/* User Stories Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated User Stories</h2>
          <div className="space-y-4">
            {userStories.map((story) => (
              <div key={story.id} className="bg-background p-4 rounded-lg shadow">
                <p>{story.content}</p>
              </div>
            ))}
          </div>
          {user ? (
            <div className="mt-6">
              <textarea
                className="w-full px-4 py-2 bg-background border border-textSecondary rounded text-textPrimary"
                rows={3}
                placeholder="Add a user story..."
                value={newStory}
                onChange={(e) => setNewStory(e.target.value)}
              />
              <button
                onClick={addUserStory}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full mt-2 py-2 px-4 rounded-lg font-semibold"
              >
                Add User Story
              </button>
            </div>
          ) : (
            <p className="text-center text-blue-500 mt-4">
              <a href={`/login?redirect=/userstories/${id}`}>Login to add a user story</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
