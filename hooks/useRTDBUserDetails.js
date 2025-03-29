import { rtdb } from "@/firebaseClient";
import { ref, onValue } from "firebase/database";
import { useEffect, useState } from "react";

export const useRTDBUserDetails = (userId) => {
  const [user, setUser] = useState(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const rtdbUserRef = ref(rtdb, `users/${userId}`);
    const unsubscribe = onValue(rtdbUserRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        setUser(snapshot.val());
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return {
    user,
    isLoading,
  };
};
