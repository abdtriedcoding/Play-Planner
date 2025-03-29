import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import { useState } from "react";
import { toast } from "sonner";

export default function RejectButton({ requestId }) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      const requestRef = doc(
        db,
        `users/${user.uid}/receivedRequests/${requestId}`
      );

      await updateDoc(requestRef, {
        status: "rejected",
      });

      toast.success("Request Rejected ✓", {
        description: "The request has been successfully declined",

        style: { background: "#4CAF50", color: "white" },
      });
    } catch (error) {
      console.error("Rejection failed:", error);
      toast.error("Failed to Reject Request", {
        description: error.message || "Please try again later",

        style: { background: "#F44336", color: "white" },
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleReject}
      disabled={isUpdating}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-75 transition-colors"
    >
      {isUpdating ? "Rejecting..." : "Reject Request"}
    </button>
  );
}
