import { toast } from "sonner";
import { db } from "@/firebaseClient";
import {
  doc,
  collection,
  writeBatch,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/authContext";
import { useState } from "react";
import { useRouter } from "next/router";

export default function SendRequestButton({
  requestedTeamId,
  requestedTeamName,
  ownerId,
  senderTeam,
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSendRequest = async () => {
    if (!user || user.uid === ownerId) return;

    setIsSending(true);
    try {
      // Check if a request already exists
      const existingRequestQuery = query(
        collection(db, "users", user.uid, "sentRequests"),
        where("requestedTeamId", "==", requestedTeamId)
      );

      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        // A request already exists, redirect to chat page
        const existingRequestDoc = existingRequestSnapshot.docs[0];
        const existingRequestData = existingRequestDoc.data();
        const chatId = existingRequestData;

        if (chatId) {
          router.push(`/chats`);
          toast.success("Redirecting to existing chat!");
        } else {
          toast.warning("Request already sent but no chat ID found.");
        }
        return;
      }

      const batch = writeBatch(db);

      // 1. Add to sender's sentRequests
      const customId = `${requestedTeamId}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const sentRequestRef = doc(
        db,
        "users",
        user.uid,
        "sentRequests",
        customId
      );
      batch.set(sentRequestRef, {
        customId,
        requestedTeamId,
        requestedTeamName,
        ownerId,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 2. Add to owner's receivedRequests
      const receivedRequestRef = doc(
        collection(db, "users", ownerId, "receivedRequests")
      );
      batch.set(receivedRequestRef, {
        customId,
        senderTeamId: senderTeam.id,
        senderTeamName: senderTeam.name,
        senderId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      toast.success("Request sent successfully!");
    } catch (error) {
      console.error("Request failed:", error);
      toast.error("Failed to send request: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleSendRequest}
      disabled={isSending || user?.uid === ownerId}
      className={`px-6 py-2 rounded-full font-medium transition-colors bg-sky-600 hover:bg-sky-700 text-white ${
        isSending ? "opacity-75 cursor-wait" : ""
      }`}
    >
      Send Request
    </button>
  );
}
