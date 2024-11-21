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
  
      if (res.ok) {
        setResult(data.brd); // Use 'brd' as returned by the backend
      } else {
        console.error("Error from API:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating BRD:", error);
      alert("An unexpected error occurred!");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">
          BRD Generator
        </h1>
        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Product Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Goals</label>
          <textarea
            className="w-full px-4 py-2 border rounded"
            rows={3}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Features (Optional)</label>
          <textarea
            className="w-full px-4 py-2 border rounded"
            rows={3}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
          ></textarea>
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={generateBRD}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate BRD"}
        </button>
      </div>
      {result && (
        <div className="mt-6 p-4 bg-white rounded shadow w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Generated BRD</h2>
          <p className="text-gray-600 whitespace-pre-line">{result}</p>
        </div>
      )}
    </div>
  );
}
