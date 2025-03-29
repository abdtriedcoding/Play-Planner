import { useAuth } from "@/context/authContext";
import { rtdb } from "@/firebaseClient";
import { ref, onValue } from "firebase/database";
import { useEffect, useState } from "react";

export function useChatIds() {
  const { user } = useAuth();
  const [chatIds, setChatIds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChatRoom = async () => {
      if (!user) return;

      try {
        const userChatIdRef = ref(rtdb, `user_chatIds/${user.uid}`);
        const unsubscribe = onValue(userChatIdRef, (snapshot) => {
          setChatIds(snapshot.exists() ? Object.keys(snapshot.val()) : []);
          setIsLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching chat IDs:", error);
        setIsLoading(false);
      }
    };

    fetchChatRoom();
  }, [user]);

  return { chatIds, isLoading };
}
