// components/TournamentForm.jsx
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/firebaseClient"; // Ensure this import points to your Firebase config
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/authContext"; // Assuming you have an auth context

export default function TournamentForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: "",
    format: "knockout",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a tournament");
      return;
    }
    setIsSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, "tournaments"), {
        ...formData,
        organizerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Tournament created successfully!");
      console.log("Tournament created with ID: ", docRef.id);
      // Reset form or redirect user
      setFormData({
        name: "",
        description: "",
        rules: "",
        format: "knockout",
        location: "",
      });
    } catch (error) {
      toast.error("Failed to create tournament: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="md:flex">
        <div className="w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create Tournament
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Tournament Name:
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter tournament name"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Description:
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Describe the tournament"
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="rules"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Rules:
              </label>
              <textarea
                id="rules"
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter tournament rules"
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="format"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Format:
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="knockout">Knockout</option>
                <option value="round-robin">Round Robin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Location:
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter location"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isSubmitting ? "Creating..." : "Create Tournament"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
