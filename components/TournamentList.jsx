import { useState, useEffect } from "react";
import { db } from "@/firebaseClient";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "tournaments"));
        const tournamentList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTournaments(tournamentList);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (isLoading) {
    return <div className="text-center py-4">Loading tournaments...</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-5">
        List Tournaments
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="p-5">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {tournament.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {tournament.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  Format: {tournament.format}
                </span>
                <span className="text-gray-500">
                  Location: {tournament.location || "N/A"}
                </span>
              </div>
              <Link
                href={`/tournaments/${tournament.id}`}
                className="inline-block mt-4 bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
