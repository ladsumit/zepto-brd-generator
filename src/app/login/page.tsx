"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/"); // Redirect to home page after successful login
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-cardBg p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text mb-4">
          {isSignUp ? "Sign Up" : "Login"}
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="email"
          className="w-full px-4 py-2 mb-4 bg-background border border-textSecondary rounded text-textPrimary"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-4 py-2 mb-4 bg-background border border-textSecondary rounded text-textPrimary"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleAuth}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white w-full py-2 px-4 rounded-lg font-semibold"
        >
          {isSignUp ? "Sign Up" : "Login"}
        </button>
        <p
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-center text-blue-500 mt-4 cursor-pointer"
        >
          {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
}
