// ✅ Final
import { useState } from "react";
import { useRouter } from "next/router";
import { collection, doc, setDoc, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebaseClient";
import { useAuth } from "@/context/authContext";
import { geohashForLocation } from "geofire-common";
import { toast } from "sonner";

const LocationInput = ({ onLocationChange }) => {
  const [manualAddress, setManualAddress] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const detectLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        toast.error("Location Access Required", {
          description: "Please enable location services to continue",
        });
        setLoading(false);
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&email=worldapp46@gmail.com`
      );
      const data = await response.json();

      const locationData = {
        coordinates: new GeoPoint(lat, lng),
        address: data.display_name,
        city: data.address.city || data.address.town || "Unknown City",
        state: data.address.state || "Unknown State",
        geohash: geohashForLocation([lat, lng]),
      };

      setCurrentLocation(locationData);
      onLocationChange(locationData);
    } catch (error) {
      toast.error("Location Error", {
        description: "Could not determine your location",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
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
          )}
          {currentLocation ? "Location Found" : "Use Current Location"}
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Or enter city name"
            className="w-full px-4 py-2 border rounded-lg pr-20"
          />
          <button
            type="button"
            onClick={() => {
              if (manualAddress.length < 3) return;
              fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${manualAddress}&email=YOUR_EMAIL`
              )
                .then((res) => res.json())
                .then((data) => {
                  if (data.length > 0) {
                    reverseGeocode(
                      parseFloat(data[0].lat),
                      parseFloat(data[0].lon)
                    );
                  }
                });
            }}
            className="absolute right-2 top-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm"
          >
            Search
          </button>
        </div>
      </div>

      {currentLocation && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-sm">Selected Location:</p>
          <p className="text-sm text-gray-600 mt-1">
            {currentLocation.address}
          </p>
        </div>
      )}
    </div>
  );
};

const SportsSelector = ({ selectedSports, onChange }) => {
  const sportsOptions = [
    "Cricket",
    "Football",
    "Basketball",
    "Tennis",
    "Badminton",
    "Volleyball",
    "Hockey",
    "Table Tennis",
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        Select Sports (Choose all that apply)
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sportsOptions.map((sport) => (
          <label
            key={sport}
            className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
              selectedSports.includes(sport)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedSports.includes(sport)}
              onChange={(e) => {
                const newSports = e.target.checked
                  ? [...selectedSports, sport]
                  : selectedSports.filter((s) => s !== sport);
                onChange(newSports);
              }}
              className="mr-2 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">{sport}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState({
    name: "",
    sports: [],
    location: null,
    avatar: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUploaded(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.warning("No Image Selected");
      return;
    }

    try {
      setImageUploading(true);
      toast.info("Uploading Image...");

      const storageRef = ref(storage, `teams/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);

      setTeam((prev) => ({ ...prev, avatar: downloadURL }));
      setImageUploaded(true);
      toast.success("Image Uploaded!");
    } catch (error) {
      toast.error("Upload Failed: " + error.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !team.location?.coordinates ||
      team.sports.length === 0 ||
      !team.avatar
    ) {
      toast.warning("Please complete all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const teamId = doc(collection(db, "ids")).id;

      const teamData = {
        ...team,
        id: teamId,
        geohash: team.location.geohash,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await Promise.all([
        setDoc(doc(db, `users/${user.uid}/my_team/${teamId}`), teamData),
        setDoc(doc(db, `publicTeams/${teamId}`), teamData),
      ]);

      toast.success("Team Created Successfully!");
      router.push("/");
    } catch (error) {
      toast.error("Creation Failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormReset = () => {
    setTeam({ name: "", sports: [], location: null, avatar: "" });
    setImageFile(null);
    setImageUploaded(false);
    toast.info("Form Cleared");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="border-b border-sky-100 pb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Team Profile Setup
          </h2>
          <p className="mt-2 text-slate-600">
            Create your team's public profile
          </p>
        </div>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            {!imageFile ? (
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  Team Logo
                </label>
                <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-sky-200 px-6 py-12 cursor-pointer hover:border-sky-300">
                  <div className="text-center">
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleImageSelect}
                      accept="image/*"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <svg
                        className="mx-auto h-12 w-12 text-sky-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-4 text-sm text-sky-600 font-medium">
                        Upload a file or drag and drop
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Team logo preview"
                    className="w-32 h-32 rounded-full border-4 border-sky-100 object-cover shadow-lg"
                  />
                  {!imageUploaded && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        Unconfirmed
                      </div>
                    </div>
                  )}
                </div>
                {!imageUploaded && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={imageUploading}
                    className={`px-6 py-2 rounded-full font-medium ${
                      imageUploading
                        ? "bg-sky-200"
                        : "bg-sky-600 hover:bg-sky-700 text-white"
                    }`}
                  >
                    {imageUploading ? "Uploading..." : "Confirm Upload"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Team Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={team.name}
              onChange={(e) => setTeam({ ...team, name: e.target.value })}
              className="w-full rounded-lg border border-sky-200 px-4 py-3 focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* Sports Selector */}
          <SportsSelector
            selectedSports={team.sports}
            onChange={(sports) => setTeam({ ...team, sports })}
          />

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Team Location
            </label>
            <LocationInput
              onLocationChange={(location) => setTeam({ ...team, location })}
            />
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-sky-100">
            <button
              type="button"
              onClick={handleFormReset}
              className="px-6 py-2.5 text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (imageFile && !imageUploaded)}
              className={`px-8 py-2.5 rounded-lg font-medium ${
                isSubmitting
                  ? "bg-sky-200"
                  : "bg-sky-600 hover:bg-sky-700 text-white shadow-lg"
              }`}
            >
              {isSubmitting ? "Saving..." : "Create Team"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
