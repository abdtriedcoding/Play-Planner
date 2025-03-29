import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/firebaseClient";

export function useMessages(chatId) {
  const [messages, setMessages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;

      try {
        const messagesRef = ref(rtdb, `messages/${chatId}`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
          if (snapshot.exists()) {
            const messagesData = Object.entries(snapshot.val()).map(
              ([id, msg]) => ({
                id,
                ...msg,
              })
            );
            setMessages(messagesData);
          } else {
            setMessages([]);
          }
          setIsLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  return { messages, isLoading };
}
