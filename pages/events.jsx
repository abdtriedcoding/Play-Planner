import React, { useState, useEffect } from "react";
import EventsDisplay from "@/components/EventsDisplay";
import { useAuth } from "@/context/authContext";
import Spinner from "@/components/Spinner";

const EventsPage = () => {
  const { user, loading } = useAuth();
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    if (user) setIsUserLoaded(true);
  }, [user]);

  if (loading) return <Spinner />;

  if (!user)
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Please login to access this page
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 shadow-lg mb-8">
        <h1 className="text-4xl font-bold text-white">Event Dashboard</h1>
        <p className="text-blue-100 mt-2">Manage your matches and requests</p>
      </div>

      {isUserLoaded && <EventsDisplay teamId={user?.uid} />}
    </div>
  );
};

export default EventsPage;
