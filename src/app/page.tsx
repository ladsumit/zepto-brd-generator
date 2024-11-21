"use client";

import { useState } from "react";

export default function Home() {
  const [productName, setProductName] = useState("");
  const [goals, setGoals] = useState("");
  const [features, setFeatures] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generateBRD = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, goals, features }),
      });
      const data = await res.json();
      setResult(data.brd); // Update key to match backend
    } catch (error) {
      console.error("Error generating BRD:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-cardBg p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-accent mb-6">BRD Generator</h1>
        <div className="mb-4">
          <label className="block text-textSecondary mb-1">Product Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-background border border-textSecondary rounded text-textPrimary"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-textSecondary mb-1">Goals</label>
          <textarea
            className="w-full px-4 py-2 bg-background border border-textSecondary rounded text-textPrimary"
            rows={3}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-textSecondary mb-1">
            Features (Optional)
          </label>
          <textarea
            className="w-full px-4 py-2 bg-background border border-textSecondary rounded text-textPrimary"
            rows={3}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
          ></textarea>
        </div>
        <button
          className="w-full bg-buttonBg hover:bg-buttonHover text-white py-2 px-4 rounded-lg font-semibold"
          onClick={generateBRD}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate BRD"}
        </button>
      </div>
      {result && (
        <div className="mt-8 p-6 bg-cardBg rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold text-accent mb-4">Generated BRD</h2>
          <p className="text-textSecondary whitespace-pre-line">{result}</p>
        </div>
      )}
    </div>
  );
}
