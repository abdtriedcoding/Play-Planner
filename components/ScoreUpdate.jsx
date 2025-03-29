import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/firebaseClient";
import { doc, updateDoc } from "firebase/firestore";

export default function ScoreUpdate({ matchId, tournamentId }) {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleScoreUpdate = async () => {
    setIsUpdating(true);
    try {
      const matchRef = doc(db, "tournaments", tournamentId, "matches", matchId);
      await updateDoc(matchRef, {
        score1: Number(score1),
        score2: Number(score2),
        status: "inProgress",
      });
      toast.success("Score updated successfully!");
    } catch (error) {
      console.error("Error updating score:", error);
      toast.error("Failed to update score: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold">Update Score:</h4>
      <div className="flex items-center space-x-4">
        <div>
          <label htmlFor="score1">Team 1:</label>
          <input
            type="number"
            id="score1"
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="score2">Team 2:</label>
          <input
            type="number"
            id="score2"
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            className="shadow appearance-none border rounded w-20 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          onClick={handleScoreUpdate}
          disabled={isUpdating}
          className={`px-4 py-2 rounded ${
            isUpdating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-700"
          } text-white`}
        >
          {isUpdating ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
}
