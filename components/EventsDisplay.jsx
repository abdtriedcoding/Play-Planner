import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import Link from "next/link";
import Spinner from "./Spinner";

const EventsDisplay = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [rejectedEvents, setRejectedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!user?.uid) return;
        setLoading(true);
        const eventsRef = collection(db, "events");

        // Fetch all relevant events in parallel
        const [
          yourPending,
          incomingPending,
          yourScheduled,
          incomingScheduled,
          yourRejected,
          incomingRejected,
        ] = await Promise.all([
          // Your pending events (team A)
          getDocs(
            query(
              eventsRef,
              where("team_id_A", "==", user.uid),
              where("status", "==", "pending")
            )
          ),
          // Incoming pending requests (team B)
          getDocs(
            query(
              eventsRef,
              where("team_id_B", "==", user.uid),
              where("status", "==", "pending")
            )
          ),
          // Your scheduled events (team A)
          getDocs(
            query(
              eventsRef,
              where("team_id_A", "==", user.uid),
              where("status", "==", "scheduled")
            )
          ),
          // Incoming scheduled events (team B)
          getDocs(
            query(
              eventsRef,
              where("team_id_B", "==", user.uid),
              where("status", "==", "scheduled")
            )
          ),
          // Your rejected events (team A)
          getDocs(
            query(
              eventsRef,
              where("team_id_A", "==", user.uid),
              where("status", "==", "rejected")
            )
          ),
          // Incoming rejected events (team B)
          getDocs(
            query(
              eventsRef,
              where("team_id_B", "==", user.uid),
              where("status", "==", "rejected")
            )
          ),
        ]);

        // Combine event lists
        setPendingEvents(
          yourPending.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
        setIncomingRequests(
          incomingPending.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
        setScheduledEvents([
          ...yourScheduled.docs.map((d) => ({ id: d.id, ...d.data() })),
          ...incomingScheduled.docs.map((d) => ({ id: d.id, ...d.data() })),
        ]);
        setRejectedEvents([
          ...yourRejected.docs.map((d) => ({ id: d.id, ...d.data() })),
          ...incomingRejected.docs.map((d) => ({ id: d.id, ...d.data() })),
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleAccept = async (eventId) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        status: "scheduled",
        last_updated: new Date().toISOString(),
      });

      // Update UI state
      setIncomingRequests((prev) => prev.filter((e) => e.id !== eventId));
      setScheduledEvents((prev) => [
        ...prev,
        incomingRequests.find((e) => e.id === eventId),
      ]);
    } catch (err) {
      setError("Failed to accept event");
    }
  };

  const handleReject = async (eventId) => {
    try {
      await updateDoc(doc(db, "events", eventId), {
        status: "rejected",
        last_updated: new Date().toISOString(),
      });

      // Update UI state
      setIncomingRequests((prev) => prev.filter((e) => e.id !== eventId));
      setRejectedEvents((prev) => [
        ...prev,
        incomingRequests.find((e) => e.id === eventId),
      ]);
    } catch (err) {
      setError("Failed to reject event");
    }
  };

  const EventCard = ({ event, type }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`px-2 py-1 rounded-full text-sm ${
            event.status === "pending"
              ? "bg-amber-100 text-amber-800"
              : event.status === "scheduled"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {event.status}
        </span>
        {event.status === "scheduled" && (
          <Link
            href={`/event/${event.id}`}
            className="text-blue-600 text-sm hover:underline"
          >
            Manage Score
          </Link>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {event.event_name || "Sports Match"}
      </h3>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>{event.date || "Date not specified"}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4" />
          <span>{event.time || "Time not specified"}</span>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <MapPinIcon className="w-4 h-4" />
          <span>{event.location || "Location not provided"}</span>
        </div>
      </div>

      {event.notes && (
        <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 mb-3">
          {event.notes}
        </div>
      )}

      {type === "incoming" && event.status === "pending" && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleAccept(event.id)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Accept
          </button>
          <button
            onClick={() => handleReject(event.id)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center text-gray-500">
      {message}
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Pending Events */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Events</h2>
          {pendingEvents.length > 0 ? (
            pendingEvents.map((event) => (
              <EventCard key={event.id} event={event} type="your" />
            ))
          ) : (
            <EmptyState message="No pending events to manage" />
          )}
        </div>

        {/* Incoming Requests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
          {incomingRequests.length > 0 ? (
            incomingRequests.map((event) => (
              <EventCard key={event.id} event={event} type="incoming" />
            ))
          ) : (
            <EmptyState message="No incoming match requests" />
          )}
        </div>
      </div>

      {/* Scheduled Matches */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Scheduled Matches</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {scheduledEvents.length > 0 ? (
            scheduledEvents.map((event) => (
              <EventCard key={event.id} event={event} type="scheduled" />
            ))
          ) : (
            <EmptyState message="No scheduled matches found" />
          )}
        </div>
      </div>

      {/* Rejected Events */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Rejected Events</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {rejectedEvents.length > 0 ? (
            rejectedEvents.map((event) => (
              <EventCard key={event.id} event={event} type="rejected" />
            ))
          ) : (
            <EmptyState message="No rejected events to display" />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsDisplay;
