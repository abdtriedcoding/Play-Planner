import { useAuth } from "@/context/authContext";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebaseClient";
import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

export default function SentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/sentRequests`),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requestsPromises = snapshot.docs.map(async (doc) => {
        const requestData = doc.data();
        const teamDetails = await fetchTeamDetails(requestData.requestedTeamId);
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
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  async function fetchTeamDetails(requestedTeamId) {
    const docRef = doc(db, "publicTeams", requestedTeamId);
    try {
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error("Error getting team details:", error);
      toast.error("Failed to load team details");
      return null;
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Please login to view your requests
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sent Requests
          </h1>
          <p className="text-gray-500">
            Track the status of your outgoing requests
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={request.teamDetails?.avatar || "/team-default.svg"}
                      alt={request.teamDetails?.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white ring-2 ring-blue-100"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {request.teamDetails?.name || "Unknown Team"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {request.teamDetails?.category || "General Sports"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : request.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="space-y-3 border-t pt-4">
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
                      Sent{" "}
                      {request.createdAt?.toDate().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {request.teamDetails?.sports?.map((sport) => (
                    <span
                      key={sport}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}

            {requests.length === 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="col-span-full py-16 text-center"
              >
                <div className="mx-auto mb-6 h-24 w-24 text-gray-300">
                  <FiSend className="w-full h-full" />
                </div>
                <h3 className="text-gray-500 text-lg font-medium">
                  No sent requests yet
                </h3>
                <p className="mt-1 text-gray-400">
                  Your sent requests will appear here
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
