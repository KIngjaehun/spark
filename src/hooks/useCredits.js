import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

export function useCredits(userId) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setCredits(userSnap.data().credits || 0);
      } else {
        // 신규 유저 - 100 크레딧 지급
        await setDoc(userRef, { credits: 100 });
        setCredits(100);
      }
      setLoading(false);
    };

    fetchCredits();
  }, [userId]);

  const addCredits = async (amount) => {
    if (!userId) return;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { credits: increment(amount) });
    setCredits((prev) => prev + amount);
  };

  const useCredits = async (amount) => {
    if (!userId || credits < amount) return false;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { credits: increment(-amount) });
    setCredits((prev) => prev - amount);
    return true;
  };

  return { credits, loading, addCredits, useCredits };
}
