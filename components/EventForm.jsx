import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { db } from "@/firebaseClient";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/router";

const EventForm = ({ chatId, teamAId, teamBId, onClose }) => {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [eventName, setEventName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!date || !time || !location || !eventName) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const eventsRef = collection(db, "events");
      const newEventRef = await addDoc(eventsRef, {
        team_id_A: teamAId,
        team_id_B: teamBId,
        event_name: eventName,
        date: date.toISOString().slice(0, 10),
        time: time,
        location: location,
        notes: notes,
        status: "pending",
        chat_id: chatId,
      });

      const eventId = newEventRef.id;
      const userAEventRef = doc(db, "users", teamAId);
      const userBEventRef = doc(db, "users", teamBId);

      await Promise.all([
        updateDoc(userAEventRef, { pendingEventCreated: arrayUnion(eventId) }),
        updateDoc(userBEventRef, { incomingEventRequest: arrayUnion(eventId) }),
      ]);

      router.push("/events");
      onClose(); // Close on success
    } catch (err) {
      console.error("Event creation error:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl mx-auto w-full max-w-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Create New Event
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="eventName"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Enter event name"
            required
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <DayPicker
            selected={date}
            onDayClick={setDate}
            mode="single"
            className="w-full border rounded-lg p-4 shadow-sm"
            modifiersClassNames={{
              selected: "!bg-blue-500 !text-white",
              today: "font-bold text-blue-500",
            }}
            classNames={{
              months: "w-full",
              month: "w-full",
              caption: "w-full flex justify-center",
              caption_label: "text-lg font-semibold",
              nav: "w-full flex justify-between",
              table: "w-full",
              head_row: "w-full",
              row: "w-full",
              cell: "w-full text-center",
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="time"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter venue or address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions or details..."
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 w-full sm:w-auto text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 w-full sm:w-auto bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-200 font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed relative"
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            <span className={isSubmitting ? "ml-4" : ""}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
