import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  limit,
  increment,
} from "firebase/firestore";
import { db } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

function EventAdminPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const [event, setEvent] = useState(null);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [winner, setWinner] = useState(null);
  const { user } = useAuth();
  const [isTeamAAuthorized, setIsTeamAAuthorized] = useState(false);
  const [isTeamBAuthorized, setIsTeamBAuthorized] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (eventId) {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = eventSnap.data();
          setEvent(eventData);
          setTeamAScore(eventData.team_a_score || 0);
          setTeamBScore(eventData.team_b_score || 0);
          setWinner(eventData.winner || null);

          async function fetchTeamData(userId, setTeam) {
            try {
              const myTeamsRef = collection(db, `users/${userId}/my_team`);
              const q = query(myTeamsRef, limit(1));
              const querySnapshot = await getDocs(q);

              if (!querySnapshot.empty) {
                const teamDoc = querySnapshot.docs[0];
                const teamId = teamDoc.id;

                const teamRef = doc(db, "publicTeams", teamId);
                const teamSnap = await getDoc(teamRef);

                if (teamSnap.exists()) {
                  setTeam(teamSnap.data());
                  return teamSnap.data();
                } else {
                  setTeam(null);
                  return null;
                }
              } else {
                setTeam(null);
                return null;
              }
            } catch (error) {
              console.error("Error fetching team data:", error);
              setTeam(null);
              return null;
            }
          }

          const teamAData = await fetchTeamData(eventData.team_id_A, setTeamA);
          const teamBData = await fetchTeamData(eventData.team_id_B, setTeamB);

          setIsTeamAAuthorized(user && teamAData?.ownerId === user.uid);
          setIsTeamBAuthorized(user && teamBData?.ownerId === user.uid);
        } else {
          setEvent(null);
        }
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId, user]);

  const handleScoreUpdate = async () => {
    if (
      (!isTeamAAuthorized && !isTeamBAuthorized) ||
      event?.status === "completed"
    ) {
      return;
    }

    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        team_a_score: parseInt(teamAScore),
        team_b_score: parseInt(teamBScore),
      });

      toast.success("Scores Updated", {
        description: "Match scores have been successfully updated.",
      });

      setEvent((prev) => ({
        ...prev,
        team_a_score: parseInt(teamAScore),
        team_b_score: parseInt(teamBScore),
      }));
    } catch (error) {
      toast.error("Update Failed", {
        description: "Failed to update scores. Please try again.",
      });
    }
  };

  const handleDeclareWinner = async () => {
    if (!isTeamAAuthorized && !isTeamBAuthorized) {
      toast.error("Authorization Required", {
        description: "You don't have permission to declare a winner.",
      });
      return;
    }

    try {
      let winningTeamId;
      let winningTeamName = null;
      let losingTeamId;

      if (parseInt(teamAScore) > parseInt(teamBScore)) {
        winningTeamId = event.team_id_A;
        winningTeamName = teamA.name;
        losingTeamId = event.team_id_B;
      } else if (parseInt(teamBScore) > parseInt(teamAScore)) {
        winningTeamId = event.team_id_B;
        winningTeamName = teamB.name;
        losingTeamId = event.team_id_A;
      } else {
        winningTeamId = "tie";
        losingTeamId = "tie";
      }

      const eventRef = doc(db, "events", eventId);

      if (winningTeamId !== "tie") {
        const winningTeamRef = doc(db, `users`, winningTeamId);
        await updateDoc(winningTeamRef, { winMatches: increment(1) });

        const losingTeamRef = doc(db, `users`, losingTeamId);
        await updateDoc(losingTeamRef, { lossMatches: increment(1) });
      }

      await updateDoc(eventRef, {
        winner: winningTeamName,
        status: "completed",
      });

      toast.success("Winner Declared", {
        description:
          winningTeamId === "tie"
            ? "The match has been recorded as a tie."
            : `${winningTeamName} has been declared the winner!`,
      });

      setEvent((prev) => ({
        ...prev,
        winner: winningTeamName,
        status: "completed",
      }));
      setWinner(winningTeamName);
    } catch (error) {
      toast.error("Declaration Failed", {
        description: "Failed to declare winner. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!event || !teamA || !teamB) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-xl font-semibold">
          Event not found
        </div>
      </div>
    );
  }

  const isCompleted = event.status === "completed";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Match Administration
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {event.event_name}
              </span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                #{eventId}
              </span>
            </div>
            <div className="space-y-1 text-gray-600">
              <p className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                {event.date}
              </p>
              <p className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                {event.time}
              </p>
              <p className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-2 text-gray-400" />
                {event.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Team A Card */}
            <div
              className={`p-6 rounded-lg ${
                isTeamAAuthorized ? "bg-indigo-50" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {teamA.name}
                </h3>
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Score
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    !isTeamAAuthorized || isCompleted
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  value={teamAScore}
                  onChange={(e) => setTeamAScore(e.target.value)}
                  disabled={!isTeamAAuthorized || isCompleted}
                />
                {!isTeamAAuthorized && (
                  <p className="text-sm text-red-600 mt-1">
                    Not authorized to update
                  </p>
                )}
              </div>
            </div>

            {/* Team B Card */}
            <div
              className={`p-6 rounded-lg ${
                isTeamBAuthorized ? "bg-emerald-50" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {teamB.name}
                </h3>
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Score
                </label>
                <input
                  type="number"
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    !isTeamBAuthorized || isCompleted
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  value={teamBScore}
                  onChange={(e) => setTeamBScore(e.target.value)}
                  disabled={!isTeamBAuthorized || isCompleted}
                />
                {!isTeamBAuthorized && (
                  <p className="text-sm text-red-600 mt-1">
                    Not authorized to update
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleScoreUpdate}
              disabled={
                (!isTeamAAuthorized && !isTeamBAuthorized) || isCompleted
              }
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                (!isTeamAAuthorized && !isTeamBAuthorized) || isCompleted
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Update Scores
            </button>

            <button
              onClick={handleDeclareWinner}
              disabled={isCompleted}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                isCompleted
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isCompleted ? "Match Completed" : "Declare Winner"}
            </button>
          </div>

          {/* Results Section */}
          {isCompleted && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-2">Match Result</h2>
              <p className="text-lg font-medium text-gray-900">
                {winner === "tie" ? (
                  <span className="text-yellow-600">It's a Tie!</span>
                ) : (
                  <>
                    Winner: <span className="text-green-600">{winner}</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventAdminPage;
