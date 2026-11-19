
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      setCurrentUser(user);
      setUserData(null);
      setLoading(true);

      if (user) {
        unsubDoc = onSnapshot(
          doc(db, "users", user.uid),
          (docSnap) => {
            setUserData(docSnap.exists() ? docSnap.data() : null);
            setLoading(false);
          },
          (error) => {
            console.error("User profile sync error:", error);
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const rawRole = (userData?.role || "Member")
    .toString()
    .toLowerCase()
    .trim();

  const isSuperAdmin =
    rawRole.includes("super admin") ||
    rawRole.includes("superadmin");

  const isAdmin =
    isSuperAdmin ||
    rawRole.includes("admin") ||
    rawRole.includes("president") ||
    rawRole.includes("secretary");

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    role: userData?.role || "Member",
    isAdmin,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
