"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [productName, setProductName] = useState("");
  const [goals, setGoals] = useState("");
  const [features, setFeatures] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); // Router for navigation

  const generateBRD = async () => {
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, goals, features }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to generate BRD");
      }

      const { brdId } = await res.json();
      router.push(`/collaboration/${brdId}`); // Redirect to collaboration page
    } catch (err: any) {
      console.error("Error generating BRD:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-extrabold text-center mb-4">
        Product Compass
      </h1>
      <h2 className="text-xl text-center text-black-400 font-medium mb-8 text-white">
        Transform your product ideas into actionable roadmaps and plans!
      </h2>
      <div className="w-full max-w-lg bg-cardBg p-8 rounded-lg shadow-lg">
        {error && (
          <div className="mb-4 text-red-500 text-sm font-medium">
            {error}
          </div>
        )}
        <div className="mb-6">
          <label className="block text-textPrimary font-bold text-lg mb-2">
            Product Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-textPrimary focus:ring-2 focus:ring-purple-500 text-white"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter your product name"
          />
        </div>
        <div className="mb-6">
          <label className="block text-textPrimary font-bold text-lg mb-2 text-white">
            Goals
          </label>
          <textarea
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-textPrimary focus:ring-2 focus:ring-purple-500 text-white"
            rows={3}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What are the goals for this product?"
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-textPrimary font-bold text-lg mb-2">
            Features (Optional)
          </label>
          <textarea
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-textPrimary focus:ring-2 focus:ring-purple-500 text-white"
            rows={3}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="Describe key features (optional)"
          ></textarea>
        </div>
        <button
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 focus:ring-4 focus:ring-purple-300 disabled:opacity-50"
          onClick={generateBRD}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Product Roadmap"}
        </button>
      </div>
      {result && (
        <div className="mt-8 p-6 bg-cardBg rounded-lg shadow-lg w-full max-w-lg">
          <h2 className="text-lg font-bold mb-4 text-textPrimary">
            Generated BRD
          </h2>
          <p className="text-textPrimary font-medium whitespace-pre-line text-lg">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
