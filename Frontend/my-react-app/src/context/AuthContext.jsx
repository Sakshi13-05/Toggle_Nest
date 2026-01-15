import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // <- added getDoc
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const docRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        // 🔥 DEFAULT ROLE (member unless explicitly admin)
        await setDoc(docRef, {
          email: firebaseUser.email,
          name: firebaseUser.displayName || "",
          role: "member", // 🔥 REQUIRED
          onboardingCompleted: false,
          createdAt: new Date(),
        });
      }

      const updatedSnap = await getDoc(docRef);
      const data = updatedSnap.data();

      // 🔥 SAFETY: role must exist
      if (!data.role) {
        await setDoc(
          docRef,
          { role: "member" },
          { merge: true }
        );
        data.role = "member";
      }

      setUser(firebaseUser);
      setUserData(data);
    } else {
      setUser(null);
      setUserData(null);
    }

    setLoading(false);
  });

  return () => unsub();
}, []);


  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => useContext(AuthContext);
