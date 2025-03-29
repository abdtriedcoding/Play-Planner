import { ref, push, serverTimestamp } from "firebase/database";
import { rtdb } from "@/firebaseClient";

export const useSendMessage = () => {
  const sendMessage = async ({ chatId, message, uid }) => {
    try {
      const messagesRef = ref(rtdb, `messages/${chatId}`);
      await push(messagesRef, {
        sender: uid,
        message,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return { sendMessage };
};
