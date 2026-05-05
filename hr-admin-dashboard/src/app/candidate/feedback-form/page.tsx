"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { addFeedback } from "../../services/candidateService";

const AddFeedback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const adminId = localStorage.getItem("adminId"); // Assuming admin login stores ID

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError("Feedback cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await addFeedback(candidateId, adminId, feedback);
      router.push(`/candidate?id=${candidateId}`);
    } catch (err) {
      console.log("Failed to submit feedback ",err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-md">
        <Breadcrumb pageName="Add Feedback" />
        <h2 className="text-2xl font-semibold mb-4">Submit Feedback</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full border p-3 rounded-md"
            placeholder="Enter your feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          ></textarea>
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default AddFeedback;

