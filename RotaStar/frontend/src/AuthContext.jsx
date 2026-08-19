import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // CREATE ACCOUNT
  // =========================
  const signup = async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = result.user;

    // Save name in Firebase Authentication
    await updateProfile(user, {
      displayName: name,
    });

    // Create Firestore user document
    const userRef = doc(db, "users", user.uid);

    const newUser = {
      uid: user.uid,
      name: name,
      email: email,

      // Every new account starts as MEMBER
      role: "member",

      // Welcome bonus
      totalPoints: 50,

      level: "Green Rotaractor",

      attendanceRate: 100,

      badgesEarned: 0,

      createdAt: serverTimestamp(),

      lastPointUpdateAt: serverTimestamp(),
    };

    await setDoc(userRef, newUser);

    return result;
  };

  // =========================
  // LOGIN
  // =========================
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return result;
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    return signOut(auth);
  };

  // =========================
  // RESET PASSWORD
  // =========================
  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // =========================
  // CHECK LOGIN STATE
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          setCurrentUser(user);

          if (!user) {
            setUserData(null);
            setLoading(false);
            return;
          }

          const userRef = doc(db, "users", user.uid);

          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            // Existing user
            setUserData({
              uid: user.uid,
              ...userSnapshot.data(),
            });
          } else {
            // Safety fallback
            const newUser = {
              uid: user.uid,
              name: user.displayName || "Member",
              email: user.email || "",
              role: "member",
              totalPoints: 50,
              level: "Green Rotaractor",
              attendanceRate: 100,
              badgesEarned: 0,
              createdAt: serverTimestamp(),
              lastPointUpdateAt: serverTimestamp(),
            };

            await setDoc(userRef, newUser);

            setUserData({
              uid: user.uid,
              ...newUser,
            });
          }
        } catch (error) {
          console.error(
            "Auth / Firestore Error:",
            error
          );

          setUserData(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  // =========================
  // ROLE CHECK
  // =========================

  const isAdmin = userData?.role === "admin";

  const isSuperAdmin =
    userData?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        isAdmin,
        isSuperAdmin,
        signup,
        login,
        logout,
        resetPassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// =========================
// USE AUTH
// =========================

export const useAuth = () => {
  return useContext(AuthContext);
};