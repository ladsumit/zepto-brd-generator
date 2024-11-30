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
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

type UserStory = {
  id: string;
  content: string;
  createdAt: Date;
};

type BRDDetails = {
  title?: string;
  goals?: string;
  features?: string;
  content?: string;
};

export default function UserStoriesPage() {
  const [brdDetails, setBrdDetails] = useState<BRDDetails | null>(null);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStory, setNewStory] = useState("");
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const params = useParams();
  const id = params?.id as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) {
      setError("No ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const docRef = doc(db, "brds", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("BRD not found.");
          setLoading(false);
          return;
        }

        const brdData = docSnap.data() as BRDDetails;
        setBrdDetails(brdData);

        const storiesRef = collection(db, "brds", id, "userstories");
        const unsubscribe = onSnapshot(storiesRef, (snapshot) => {
          const storiesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            content: doc.data().content as string,
            createdAt: doc.data().createdAt?.toDate() as Date,
          }));

          if (storiesData.length === 0) {
            generateUserStories(brdData); // Generate user stories if none exist
          }

          setUserStories(storiesData);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching BRD details:", err);
      
        if (err instanceof Error) {
          setError(err.message || "Something went wrong.");
        } else {
          setError("An unknown error occurred.");
        }
      }
       finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const generateUserStories = async (brdData: BRDDetails) => {
    if (!id || !brdData) {
      setError("Missing BRD ID or details");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      const response = await fetch("/api/generateUserStories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brdId: id,
          title: brdData.title,
          goals: brdData.goals,
          features: brdData.features,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate user stories");
      }
  
      // Explicitly type the response
      const { stories }: { stories: UserStory[] } = await response.json();
  
      // Ensure unique IDs
      const uniqueStories = stories.map((story: UserStory) => ({
        ...story,
        id: `${story.id}-${Date.now()}`, // Add a timestamp to make IDs unique
      }));
  
      setUserStories((prevStories) => [...prevStories, ...uniqueStories]);
    } catch (err) {
      console.error("Error generating user stories:", err);
  
      if (err instanceof Error) {
        setError(err.message || "Something went wrong.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  

  const addUserStory = async () => {
    if (!newStory.trim() || !id) return;

    try {
      const storiesRef = collection(db, "brds", id, "userstories");
      await addDoc(storiesRef, {
        content: newStory,
        createdAt: new Date(),
      });
      setNewStory("");
    } catch (err) {
      console.error("Error adding user story:", err);
      setError("Failed to add user story. Please try again.");
    }
  };

  const saveEditedStory = async () => {
    if (!editingStory || !id) return;

    try {
      const storyDocRef = doc(db, "brds", id, "userstories", editingStory.id);
      await updateDoc(storyDocRef, { content: editingStory.content });
      setEditingStory(null);
    } catch (err) {
      console.error("Error saving user story:", err);
      setError("Failed to save user story. Please try again.");
    }
  };

  const deleteUserStory = async (storyId: string) => {
    if (!id) return;

    try {
      const storyDocRef = doc(db, "brds", id, "userstories", storyId);
      await deleteDoc(storyDocRef);
      setUserStories((prevStories) =>
        prevStories.filter((story) => story.id !== storyId)
      );
    } catch (err) {
      console.error("Error deleting user story:", err);
      setError("Failed to delete user story. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center mt-8 text-xl text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-extrabold text-center mb-4 text-white">
        User Stories
      </h1>
      <div className="w-full max-w-lg bg-cardBg p-8 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-white">
            Product Requirements
          </h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p>
              <strong>Title:</strong> {brdDetails?.title || "N/A"}
            </p>
            <p>
              <strong>Goals:</strong> {brdDetails?.goals || "N/A"}
            </p>
            <p>
              <strong>Features:</strong> {brdDetails?.features || "N/A"}
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">
            Generated User Stories
          </h2>
          <div className="space-y-4">
            {userStories.map((story) => (
              <div
                key={story.id}
                className="bg-gray-800 p-4 rounded-lg shadow border"
              >
                {editingStory?.id === story.id ? (
                  <textarea
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    value={editingStory.content}
                    onChange={(e) =>
                      setEditingStory({
                        ...editingStory,
                        content: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-white">{story.content}</p>
                )}
                <div className="flex justify-end space-x-2 mt-2">
                  {editingStory?.id === story.id ? (
                    <button
                      onClick={saveEditedStory}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingStory(story)}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => deleteUserStory(story.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <textarea
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            rows={3}
            placeholder="Add a user story..."
            value={newStory}
            onChange={(e) => setNewStory(e.target.value)}
          />
          <button
            onClick={addUserStory}
            className="w-full py-3 px-4 mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 focus:ring-4 focus:ring-purple-300 disabled:opacity-50"
          >
            Add User Story
          </button>
        </div>
      </div>
    </div>
  );
}
