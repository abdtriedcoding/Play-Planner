import { db } from "@/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useUser(uid) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!uid) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getDoc(doc(db, `users/${uid}`));
        if (res.exists()) {
          setUser(res.data());
        } else {
          console.error("User not found");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  return { user, isLoading };
}
