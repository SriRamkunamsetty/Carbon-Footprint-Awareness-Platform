"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onboardUser: (data: Partial<UserProfile>) => Promise<void>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMock, setIsMock] = useState<boolean>(false);

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

    if (!isMock) {
      await setDoc(doc(db, "users", uid), defaultProfile);
    }
    return defaultProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Real user session exists, clear any guest mock data
        localStorage.removeItem("carbonmind_mock_profile");
        setUser(currentUser);
        setIsMock(false);
        try {
          const docRef = doc(db, "users", currentUser.uid);
          
          // Timeout race to prevent indefinite hanging if Firestore database has not been created in console
          const fetchPromise = getDoc(docRef);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Firestore fetch timeout")), 1500)
          );
          
          const docSnap = await Promise.race([fetchPromise, timeoutPromise]);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Document doesn't exist, create it
            const newProfile = await createDefaultProfile(
              currentUser.uid,
              currentUser.email || "",
              currentUser.displayName || "",
              currentUser.photoURL
            );
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          // If Firestore is blocked or errors, fallback to local profile with the actual user details
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
          setIsMock(false);
        }
      } else {
        // No real user, check if we have a mock profile session stored in localStorage
        const savedMockProfile = localStorage.getItem("carbonmind_mock_profile");
        if (savedMockProfile) {
          const mockProf: UserProfile = JSON.parse(savedMockProfile);
          setProfile(mockProf);
          setIsMock(true);
          setUser({
            uid: mockProf.uid,
            email: mockProf.email,
            displayName: mockProf.name,
            photoURL: mockProf.photoURL,
            emailVerified: true,
          } as User);
        } else {
          setUser(null);
          setProfile(null);
          setIsMock(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const enableDemoMode = () => {
    const mockUid = "demo-user-123";
    const demoProfile: UserProfile = {
      uid: mockUid,
      name: "Alex Greenfield",
      email: "alex@carbonmind.ai",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
      createdAt: new Date(),
      country: "United States",
      age: 28,
      occupation: "Environmental Consultant",
      streak: 5,
      points: 480,
      goal: 300,
      preferences: {
        theme: "dark",
        notifications: true,
        weeklyDigest: true,
      },
      carbonScore: 82,
      onboarded: true,
    };
    setIsMock(true);
    setProfile(demoProfile);
    setUser({
      uid: mockUid,
      email: demoProfile.email,
      displayName: demoProfile.name,
      photoURL: demoProfile.photoURL,
      emailVerified: true,
    } as User);
    localStorage.setItem("carbonmind_mock_profile", JSON.stringify(demoProfile));
    setLoading(false);
  };

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
      localStorage.removeItem("carbonmind_mock_profile");
      if (!isMock) {
        await signOut(auth);
      }
      setUser(null);
      setProfile(null);
      setIsMock(false);
    } catch (error) {
      console.error("Signout failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isMock) return;
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

    if (isMock) {
      localStorage.setItem("carbonmind_mock_profile", JSON.stringify(updated));
    } else {
      try {
        const docRef = doc(db, "users", profile.uid);
        await updateDoc(docRef, data);
      } catch (error) {
        console.error("Error updating Firestore profile:", error);
      }
    }
  };

  const onboardUser = async (data: Partial<UserProfile>) => {
    await updateProfile({
      ...data,
      onboarded: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isMock,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        resetPassword,
        updateProfile,
        onboardUser,
        enableDemoMode,
      }}
    >
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
