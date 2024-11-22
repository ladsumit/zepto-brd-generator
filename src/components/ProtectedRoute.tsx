"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // Ensure this is set up correctly
import { onAuthStateChanged, User } from "firebase/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); // Redirect to login if unauthenticated
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe(); // Clean up subscription on unmount
  }, [router]);

  if (!user) {
    return (
      <div>
        Loading...
      </div>
    ); // Wrap JSX elements in parentheses
  }

  return <>{children}</>;
}
