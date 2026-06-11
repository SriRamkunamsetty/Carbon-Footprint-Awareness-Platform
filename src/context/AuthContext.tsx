"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onboardUser: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper: Create default profile structure
  const createDefaultProfile = async (uid: string, email: string, name: string, photoURL: string | null) => {
    const defaultProfile: UserProfile = {
      uid,
      name: name || "Eco Citizen",
      email,
      photoURL: photoURL || null,
      createdAt: new Date(),
      country: "",
      age: 25,
      occupation: "",
      streak: 0,
      points: 50, // Starter eco points
      goal: 350,  // Target monthly carbon in kg CO2
      preferences: {
        theme: "dark",
        notifications: true,
        weeklyDigest: true,
      },
      carbonScore: 75,
      onboarded: false,
    };

    try {
      await setDoc(doc(db, "users", uid), defaultProfile);
    } catch (e) {
      console.error("Failed to create default profile in Firestore", e);
    }
    return defaultProfile;
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      // Clean up previous profile subscription if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        setUser(currentUser);
        // Set session cookie for middleware
        currentUser.getIdToken().then((token) => {
          Cookies.set("__session", token, { expires: 14 });
        });

        try {
          const docRef = doc(db, "users", currentUser.uid);

          // Subscribe to profile changes
          unsubscribeProfile = onSnapshot(
            docRef,
            async (docSnap) => {
              if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
                setLoading(false);
              } else {
                // Document doesn't exist, create it
                const newProfile = await createDefaultProfile(
                  currentUser.uid,
                  currentUser.email || "",
                  currentUser.displayName || "",
                  currentUser.photoURL
                );
                setProfile(newProfile);
                setLoading(false);
              }
            },
            async (error) => {
              console.error("Error subscribing to user profile:", error);
              // Fallback to local profile with the actual user details
              const fallbackProfile: UserProfile = {
                uid: currentUser.uid,
                name: currentUser.displayName || currentUser.email?.split("@")[0] || "Eco Citizen",
                email: currentUser.email || "",
                photoURL: currentUser.photoURL || null,
                createdAt: new Date(),
                country: "United States",
                age: 25,
                occupation: "Eco Advocate",
                streak: 1,
                points: 100,
                goal: 350,
                preferences: {
                  theme: "dark",
                  notifications: true,
                  weeklyDigest: true,
                },
                carbonScore: 75,
                onboarded: true,
              };
              setProfile(fallbackProfile);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error("Error setting up user profile subscription:", error);
          setLoading(false);
        }
      } else {
        Cookies.remove("__session");
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Wait for onAuthStateChanged to pick up the user and initialize profile,
      // but we update the display name here
      if (userCredential.user) {
        const uid = userCredential.user.uid;
        const newProfile = await createDefaultProfile(uid, email, name, null);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Email signup failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      Cookies.remove("__session");
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Signout failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);

    try {
      const docRef = doc(db, "users", profile.uid);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating Firestore profile:", error);
    }
  };

  const onboardUser = async (data: Partial<UserProfile>) => {
    await updateProfile({
      ...data,
      onboarded: true,
    });
  };

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      loading,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
      resetPassword,
      updateProfile,
      onboardUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
