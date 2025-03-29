import { useAuth } from "@/context/authContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebaseClient";
import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import RejectButton from "@/components/RejectButton";
import AcceptButton from "@/components/AcceptButton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FiMapPin, FiUsers, FiClock } from "react-icons/fi";

export default function ReceivedRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/receivedRequests`),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requestsPromises = snapshot.docs.map(async (doc) => {
        const requestData = doc.data();
        const teamDetails = await fetchTeamDetails(requestData.senderTeamId);
        return {
          id: doc.id,
          ...requestData,
          teamDetails: teamDetails,
        };
      });

      try {
        const requestsData = await Promise.all(requestsPromises);
        setRequests(requestsData);
      } catch (error) {
        toast.error("Error loading requests");
        console.log("Error loading requests" + error);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  async function fetchTeamDetails(teamId) {
    const docRef = doc(db, "publicTeams", teamId);
    try {
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error("Error getting team details:", error);
      toast.error("Failed to load team details");
      return null;
    }
  }

  console.log(requests);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Please login to view requests
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Received Requests
          </h1>
          <p className="text-gray-500">
            Manage your incoming collaboration requests
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl p-6 shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {requests.map((request) => (
              <motion.div
                key={request.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={request.teamDetails?.avatar || "/team-default.svg"}
                      alt={request.teamDetails?.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white ring-2 ring-blue-100"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {request.teamDetails?.name || "Unknown Team"}
                    </h3>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiMapPin className="flex-shrink-0 mr-2 text-blue-500" />
                        <span className="truncate">
                          {request.teamDetails?.location?.city ||
                            "Location not specified"}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="flex-shrink-0 mr-2 text-purple-500" />
                        <span>
                          {new Date(
                            request.createdAt?.toDate()
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {request.teamDetails?.sports?.map((sport) => (
                        <span
                          key={sport}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <RejectButton
                    requestId={request.id}
                    className="hover:bg-red-50 hover:text-red-700"
                  />
                  <AcceptButton
                    requestId={request.id}
                    className="hover:bg-green-50 hover:text-green-700"
                  />
                </div>
              </motion.div>
            ))}

            {requests.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="mx-auto mb-6 h-24 w-24 text-gray-300">
                  <FiUsers className="w-full h-full" />
                </div>
                <h3 className="text-gray-500 text-lg font-medium">
                  No pending requests
                </h3>
                <p className="mt-1 text-gray-400">
                  You'll see new requests here when teams reach out
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
