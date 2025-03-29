import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import { distanceBetween } from "geofire-common";
import SendRequestButton from "@/components/SendRequestButton";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const TeamList = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedSports, setSelectedSports] = useState([]);
  const [searchRadius, setSearchRadius] = useState(25);
  const [userLocation, setUserLocation] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  // Fetch all teams from publicTeams collection
  useEffect(() => {
    const q = query(collection(db, "publicTeams"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTeams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(allTeams);
      setFilteredTeams(allTeams);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user's team information
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, `users/${user.uid}/my_team`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const teamData = snapshot.docs[0].data(); // Assuming a user can only have one team
        setUserTeam({ id: snapshot.docs[0].id, name: teamData.name });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => console.error("Location access denied", error)
    );
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...teams];

    // Search filter (client-side filter by team name)
    if (searchTerm) {
      result = result.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sport filter (client-side AND logic)
    if (selectedSports.length > 0) {
      result = result.filter((team) =>
        selectedSports.every((sport) => team.sports.includes(sport))
      );
    }

    // Location filter (client-side)
    if (userLocation) {
      result = result.filter((team) => {
        const teamCoords = team.location.coordinates;
        const distance = distanceBetween(
          [userLocation.lat, userLocation.lng],
          [teamCoords.latitude, teamCoords.longitude]
        );
        return distance <= searchRadius;
      });
    }

    setFilteredTeams(result);
  }, [selectedSports, searchRadius, userLocation, teams, searchTerm]); // Add searchTerm to the dependency array

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>

              {/* Location Filter */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Location</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1km</span>
                    <span>{searchRadius}km</span>
                    <span>100km</span>
                  </div>
                </div>
              </div>

              {/* Sport Filter */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Sports</h3>
                <div className="space-y-2">
                  {["Cricket", "Football", "Basketball", "Tennis"].map(
                    (sport) => (
                      <label
                        key={sport}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSports.includes(sport)}
                          onChange={(e) => {
                            const newSports = e.target.checked
                              ? [...selectedSports, sport]
                              : selectedSports.filter((s) => s !== sport);
                            setSelectedSports(newSports);
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm text-gray-600">{sport}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSports([]);
                  setSearchRadius(25);
                }}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Team Listing */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredTeams.length} Team{filteredTeams.length !== 1 && "s"}{" "}
                  Found
                </h2>

                {/* Search Input */}
                <div className="mt-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by team name"
                    className="w-full px-4 py-2 rounded-md border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={team.avatar || "/default-team.png"}
                          alt={team.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {team.location?.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {team.sports?.map((sport) => (
                          <span
                            key={sport}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="w-5 h-5 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="line-clamp-1">
                            {team.location?.address}
                          </span>
                        </div>
                        {userLocation && team.location?.coordinates && (
                          <p className="text-sm text-gray-500">
                            {Math.round(
                              distanceBetween(
                                [userLocation.lat, userLocation.lng],
                                [
                                  team.location.coordinates.latitude,
                                  team.location.coordinates.longitude,
                                ]
                              )
                            )}{" "}
                            km away
                          </p>
                        )}
                      </div>

                      {team.ownerId === user?.uid ? (
                        <div className="px-6 py-2 rounded-full font-medium transition-colors bg-sky-600 hover:bg-sky-700 text-white flex items-center">
                          <UserCircleIcon className="h-5 w-5 mr-2" />
                          Your Team
                        </div>
                      ) : (
                        <SendRequestButton
                          requestedTeamId={team.id}
                          requestedTeamName={team.name}
                          ownerId={team.ownerId}
                          senderTeam={userTeam}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTeams.length === 0 && (
                <div className="p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No teams found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Adjust filters or expand search radius
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamList;
