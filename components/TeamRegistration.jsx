// components/TeamRegistration.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/firebaseClient";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/context/authContext";
import { query, collection, where, getDocs } from "firebase/firestore";

export default function TeamRegistration({ tournamentId }) {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // New state variable

  useEffect(() => {
    const fetchTeamAndRegistrationStatus = async () => {
      setIsLoading(true);
      try {
        // Fetch the team associated with the logged-in user
        const teamsQuery = query(
          collection(db, "publicTeams"),
          where("ownerId", "==", user.uid)
        );
        const teamsSnapshot = await getDocs(teamsQuery);

        if (!teamsSnapshot.empty) {
          const teamData = {
            id: teamsSnapshot.docs[0].id,
            ...teamsSnapshot.docs[0].data(),
          };
          setTeam(teamData);

          // Check if the team is already registered for the tournament
          const tournamentRef = doc(db, "tournaments", tournamentId);
          const tournamentSnap = await getDoc(tournamentRef);

          if (tournamentSnap.exists()) {
            const tournamentData = tournamentSnap.data();
            const registeredTeams = tournamentData.teams || [];
            setIsRegistered(registeredTeams.includes(teamData.id));
          }
        } else {
          toast.error("You do not have a team. Please create a team first.");
        }
      } catch (error) {
        console.error("Error fetching team:", error);
        toast.error("Failed to fetch team: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTeamAndRegistrationStatus();
    }
  }, [user, tournamentId]);

  const handleRegister = async () => {
    if (!user || !team) return;

    setIsRegistering(true);
    try {
      const tournamentRef = doc(db, "tournaments", tournamentId);
      await updateDoc(tournamentRef, {
        teams: arrayUnion(team.id),
      });

      toast.success("Team registered successfully!");
      setIsRegistered(true); // Update registration status after successful registration
    } catch (error) {
      console.error("Team registration failed:", error);
      toast.error("Failed to register team: " + error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!team) {
    return <div>You do not have a team. Please create a team first.</div>;
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isRegistering || isRegistered} // Disable button if registering or already registered
      className={`px-4 py-2 rounded ${
        isRegistered
          ? "bg-green-500 cursor-not-allowed"
          : isRegistering
          ? "bg-sky-400 cursor-not-allowed"
          : "bg-sky-600 hover:bg-sky-700"
      } text-white`}
    >
      {isRegistered
        ? "Registered"
        : isRegistering
        ? "Registering..."
        : "Register Team"}
    </button>
  );
}
