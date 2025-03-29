// components/TournamentDetails.jsx
import { useState, useEffect } from "react";
import { db } from "@/firebaseClient";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import TeamRegistration from "./TeamRegistration";
import { useAuth } from "@/context/authContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import ScoreUpdate from "./ScoreUpdate";
import Leaderboard from "./Leaderboard";

export default function TournamentDetails({ tournamentId }) {
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  useEffect(() => {
    const fetchTournament = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "tournaments", tournamentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tournamentData = { id: docSnap.id, ...docSnap.data() };
          setTournament(tournamentData);

          // Fetch registered teams
          if (tournamentData.teams && tournamentData.teams.length > 0) {
            const teamsQuery = query(
              collection(db, "publicTeams"),
              where("id", "in", tournamentData.teams)
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamsList = teamsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setRegisteredTeams(teamsList);
          }

          // Fetch matches
          const matchesQuery = query(
            collection(db, "tournaments", tournamentId, "matches")
          );
          const matchesSnapshot = await getDocs(matchesQuery);
          const matchesList = matchesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMatches(matchesList);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching tournament:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId]);

  const generateSchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const functions = getFunctions();
      const generateMatchSchedule = httpsCallable(
        functions,
        "generateMatchSchedule"
      );

      await generateMatchSchedule({
        tournamentId: tournamentId,
        format: tournament?.format,
      });

      console.log("Match schedule generated successfully!");
      // Refresh tournament data after generating schedule
      fetchTournament();
    } catch (error) {
      console.error("Error generating match schedule:", error);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  if (isLoading) {
    return <div>Loading tournament details...</div>;
  }

  if (!tournament) {
    return <div>Tournament not found.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{tournament.name}</h2>
      <p className="text-gray-600">{tournament.description}</p>
      <p>Format: {tournament.format}</p>
      <p>Location: {tournament.location}</p>

      <TeamRegistration tournamentId={tournament.id} />

      <button
        onClick={generateSchedule}
        disabled={isGeneratingSchedule}
        className={`px-4 py-2 rounded ${
          isGeneratingSchedule
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-sky-600 hover:bg-sky-700"
        } text-white`}
      >
        {isGeneratingSchedule
          ? "Generating Schedule..."
          : "Generate Match Schedule"}
      </button>

      {registeredTeams.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Registered Teams:</h3>
          <ul>
            {registeredTeams.map((team) => (
              <li key={team.id} className="py-2 border-b border-gray-200">
                {team.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Match Schedule:</h3>
        {matches.length === 0 ? (
          <div>No matches scheduled yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow-md p-4">
                <h4 className="font-semibold">Match {match.round}</h4>
                <p>Team 1: {match.team1Id}</p>
                <p>Team 2: {match.team2Id || "TBD"}</p>
                <p>Status: {match.status}</p>
                <ScoreUpdate matchId={match.id} tournamentId={tournamentId} />
                <Leaderboard tournamentId={tournamentId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
