import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/firebaseClient";

export function useChatRoom(chatId) {
  const [chatRoom, setChatRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChatRoom = async () => {
      if (!chatId) return;

      try {
        const chatRoomRef = ref(rtdb, `chat_rooms/${chatId}`);
        const unsubscribe = onValue(chatRoomRef, (snapshot) => {
          if (snapshot.exists()) {
            setChatRoom({ id: chatId, ...snapshot.val() });
          }
          setIsLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching chat room:", error);
        setIsLoading(false);
      }
    };

    fetchChatRoom();
  }, [chatId]);

  return { chatRoom, isLoading };
}
