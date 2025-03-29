// components/Leaderboard.jsx
import { useState, useEffect } from "react";
import { db } from "@/firebaseClient";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function Leaderboard({ tournamentId }) {
  const [teamStats, setTeamStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const teamStatsQuery = query(
          collection(db, "teamStats"),
          where("tournamentId", "==", tournamentId),
          orderBy("points", "desc"),
          orderBy("goalDifference", "desc")
        );
        const teamStatsSnapshot = await getDocs(teamStatsQuery);
        const teamStatsList = teamStatsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTeamStats(teamStatsList);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [tournamentId]);

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      {teamStats.length === 0 ? (
        <div>No team stats available.</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Team</th>
              <th className="text-left">Matches Played</th>
              <th className="text-left">Wins</th>
              <th className="text-left">Losses</th>
              <th className="text-left">Draws</th>
              <th className="text-left">GF</th>
              <th className="text-left">GA</th>
              <th className="text-left">GD</th>
              <th className="text-left">Points</th>
            </tr>
          </thead>
          <tbody>
            {teamStats.map((stat) => (
              <tr key={stat.id}>
                <td>{stat.teamId}</td>
                <td>{stat.matchesPlayed}</td>
                <td>{stat.wins}</td>
                <td>{stat.losses}</td>
                <td>{stat.draws}</td>
                <td>{stat.goalsFor}</td>
                <td>{stat.goalsAgainst}</td>
                <td>{stat.goalDifference}</td>
                <td>{stat.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
