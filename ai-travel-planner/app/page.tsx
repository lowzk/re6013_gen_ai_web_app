"use client"
import { useState } from "react";
import { motion } from "framer-motion";

interface TravelResponse {
  trip_title: string;
  destination: string;
  budget: number;
  days: { day: number; title: string; activities: { time: string; description: string }[] }[];
}

export default function TravelPlanner() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "Male",
    location: "",
    interests: "",
    budget: "",
    days: "",
  });
  const [response, setResponse] = useState<TravelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ age?: string }>({});
  const [currentDay, setCurrentDay] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: { age?: string } = {};

    const age = parseInt(formData.age, 10);
    if (isNaN(age) || age < 0 || age > 120) {
      newErrors.age = "Age must be an integer between 0 and 120.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data: TravelResponse = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Error fetching itinerary:", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Travel Planner</h1>
      <h2 className="text-sm">Done by Low Zhe Kai</h2>
      <br></br>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="age"
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>

        <input
          name="location"
          type="text"
          placeholder="Destination"
          value={formData.location}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <textarea
          name="interests"
          placeholder="Interests (comma-separated)"
          value={formData.interests}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <input
          name="budget"
          type="number"
          placeholder="Budget (USD)"
          value={formData.budget}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <input
          name="days"
          type="number"
          placeholder="Number of Days"
          value={formData.days}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />

        <button type="submit" disabled={loading} className="w-full p-2 bg-blue-500 text-white rounded">
          {loading ? "Generating..." : "Get Itinerary"}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="text-xl font-bold">{response.trip_title}</h2>
          <p><strong>Destination:</strong> {response.destination}</p>
          <p><strong>Budget:</strong> ${response.budget}</p>
          <h3 className="mt-2 font-bold">Daily Itinerary:</h3>
          <div className="relative overflow-hidden w-full">
            <div className="relative w-full overflow-hidden">
            <motion.div
              className="flex space-x-4"
              animate={{ x: -currentDay * 320 }}
              transition={{ type: "spring", stiffness: 500, damping: 50 }}
              style={{ minWidth: "100%", display: "flex" }}
            >
                {response.days.map((day, index) => (
                  <div key={index} className="flex-shrink-0 w-[320px] p-4 border rounded shadow-md bg-white">
                    <h4 className="font-semibold">Day {day.day}: {day.title}</h4>
                    <ul className="list-disc pl-4">
                      {day.activities.map((activity, idx) => (
                        <li key={idx}>{activity.time}: {activity.description}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="flex justify-between mt-2">
              <button disabled={currentDay === 0} onClick={() => setCurrentDay(currentDay - 1)} className="p-2 bg-gray-300 rounded">← Prev</button>
              <button disabled={currentDay === response.days.length - 1} onClick={() => setCurrentDay(currentDay + 1)} className="p-2 bg-gray-300 rounded">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
