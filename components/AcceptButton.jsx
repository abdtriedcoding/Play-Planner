import { toast } from "sonner";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db, rtdb } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ref as rtdbRef, set, push } from "firebase/database";

export default function AcceptButton({ requestId }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAccept = async () => {
    if (!user || !requestId) return;
    setIsUpdating(true);

    try {
      // 1. Get receiver's request document
      const receivedRequestRef = doc(
        db,
        `users/${user.uid}/receivedRequests/${requestId}`
      );
      const receivedRequestSnap = await getDoc(receivedRequestRef);

      if (!receivedRequestSnap.exists()) {
        throw new Error("Request not found in your received requests");
      }

      const requestData = receivedRequestSnap.data();
      const senderId = requestData.senderId;

      if (!senderId) {
        throw new Error("Sender information missing in the request");
      }

      // 2. Verify sender's request document exists
      const senderRequestRef = doc(
        db,
        `users/${senderId}/sentRequests/${requestData.customId}` // TODO: Fixed requestId usage
      );
      const senderRequestSnap = await getDoc(senderRequestRef);

      if (!senderRequestSnap.exists()) {
        throw new Error("This request has been withdrawn by the sender");
      }

      // 3. Generate unique chat ID using RTDB push
      const chatPushRef = push(rtdbRef(rtdb, "chat_rooms"));
      const newChatId = `chatId_${chatPushRef.key}`;

      const batch = writeBatch(db);

      // Update both request documents with chat ID
      batch.update(receivedRequestRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      batch.update(senderRequestRef, {
        status: "accepted",
        updatedAt: serverTimestamp(),
      });

      // 4. Execute all Firestore updates
      await batch.commit();

      // 5. Create chat room in Realtime Database
      await set(rtdbRef(rtdb, `chat_rooms/${newChatId}`), {
        uid1: user.uid,
        uid2: senderId,
        requestId: requestId,
        createdAt: { ".sv": "timestamp" }, // RTDB server timestamp
      });

      // 6. Add welcome message
      const welcomeMessageRef = push(rtdbRef(rtdb, `messages/${newChatId}`));
      await set(welcomeMessageRef, {
        message: "Thanks for using Tournament Organizer! You can now chat!",
        sender: "system",
        timestamp: { ".sv": "timestamp" }, // RTDB server timestamp
      });

      // 7. Notify and redirect
      toast.success("Request Accepted ✅", {
        description: "Chat room created successfully",
        style: { background: "#4CAF50", color: "white" },
      });

      router.push(`/chats`);
    } catch (error) {
      console.error("Acceptance failed:", error);
      toast.error("Failed to Accept Request", {
        description:
          error.message || "Please check your connection and try again",
        style: { background: "#F44336", color: "white" },
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={isUpdating}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-75 transition-colors"
    >
      {isUpdating ? "Accepting..." : "Accept Request"}
    </button>
  );
}
