"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { addFeedbackRoundWise, getCandidate } from "../../services/candidateService";


// Define the Candidate interface
interface Candidate {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  qualification: string;
  yearOfPassedOut: number | null;
  currentCity: string;
  desiredRole: string;
  workExperience: number;
  resume: string | null;
  idProof: string | null;
  createdAt: string;
  updatedAt: string;
  score: number | null;
  status: 
    | "Applied"
    | "Screening"
    | "Shortlisted"
    | "Interview Scheduled"
    | "Interview Completed"
    | "InProgress"
    | "Feedback Pending"
    | "Rejected"
    | "Hired";
  videoPath: string | null;
  videoAnalysis: VideoAnalysis | null;
  interviewScheduledAt?: string;
  assignedInterviewer?: Interviewer | null;
  rounds: InterviewRound[] | null;
  interviews: Interview[];
  feedbacks: Feedback[] | null;
}

// Define a simplified version of Candidate for Interview to avoid circular references
interface InterviewCandidate {
  id: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  qualification: string;
  yearOfPassedOut: number | null;
  currentCity: string;
  desiredRole: string;
  workExperience: number;
  resume: string | null;
  idProof: string | null;
  createdAt: string;
  updatedAt: string;
  score: number | null;
  status:
    | "Applied"
    | "Screening"
    | "Shortlisted"
    | "Interview Scheduled"
    | "Interview Completed"
    | "InProgress"
    | "Feedback Pending"
    | "Rejected"
    | "Hired";
  videoPath: string | null;
  interviewScheduledAt?: string;
}

// Define the Interview interface
interface Interview {
  id: number;
  round: number;
  feedback: string | null;
  score: number | null;
  status: "Pending" | "Completed" | "Canceled";
  scheduledDate: string;
  createdAt: string;
  updatedAt: string;
  interviewer?: Interviewer | null;
  candidate: InterviewCandidate;
}

// Define the Interviewer interface
interface Interviewer {
  id: number;
  name: string;
  email: string;
  skills: string[];
  department: string;
  availability: "Available" | "Busy" | "On Leave";
  createdAt: string;
  updatedAt: string;
}

interface InterviewRound {
  id: number;
  roundName: string;
  feedback: string | null;
  score: number | null;
  totalScore: number;
  status: "Pending" | "Completed";
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  id: number;
  strengths: string;
  weaknesses: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for Video Analysis Data
interface VideoAnalysis {
  result?: {
    video_analysis?: string[][]; // Assuming it's a 2D array of strings
    audio_analysis?: {
      tone_rating?: string;
      fluency_metrics?: {
        speech_speed_wpm?: number;
      };
      overall_rating_score?: string;
      fluency_rating?: string;
      transcript?: string;
    };
  };
}


const FeedbackForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id");
  const round = searchParams.get("round");
  const initialFeedback = searchParams.get("feedback") || "";
  const initialScore = searchParams.get("score") || "";

  const [score, setScore] = useState(initialScore);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [candidate, setCandidate] = useState<Candidate | null>(null);


   useEffect(() => {
    if (candidateId) {
      console.log("Fetching candidate with ID:", candidateId);
      getCandidate(candidateId)
        .then((data) => {
          setCandidate(data)
        })
        .catch((err) => console.error("Error fetching candidate:", err));
    }
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId || !round) {
      setMessage({ type: "error", text: "Invalid candidate or round details." });
      return;
    }

    // Parse feedback if provided
    if (initialFeedback) {
      const feedbackLines = decodeURIComponent(initialFeedback).split("\n");
      feedbackLines.forEach((line) => {
        if (line.startsWith("**Strengths:**")) setStrengths(line.replace("**Strengths:**", "").trim());
        if (line.startsWith("**Weaknesses:**")) setWeaknesses(line.replace("**Weaknesses:**", "").trim());
        if (line.startsWith("**Comments:**")) setComments(line.replace("**Comments:**", "").trim());
      });
    }
  }, [candidateId, round, initialFeedback]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!candidateId || !round) {
      setMessage({ type: "error", text: "Invalid candidate or round details." });
      return;
    }

    if (!score.trim() || !comments.trim()) {
      setMessage({ type: "error", text: "Score and Comments are required." });
      return;
    }

    setLoading(true);
    try {
      await addFeedbackRoundWise({
        candidateId,
        round,
        score: Number(score),
        strengths,
        weaknesses,
        comments,
      });

      //router.push(`/candidate?id=${candidateId}`);
      setMessage({ type: "success", text: "Feedback submitted successfully!" });
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setMessage({ type: "error", text: "Failed to submit feedback. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-md">
        <Breadcrumb pageName={initialFeedback ? "Feedback" : "Feedback"} />

        <div className="flex justify-between items-center mb-4">
          {/* <h2 className="text-2xl font-semibold">
            {initialFeedback ? "Edit Feedback" : "Submit Feedback"}
          </h2> */}
          <button
            onClick={() => router.push(`/candidate?id=${candidateId}`)}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            Back
          </button>
        </div>

        {message.text && (
          <div className={`mb-4 text-white p-3 rounded-md text-center ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Candidate & Round Info */}
          <div className="bg-gray-100 p-4 rounded-md">
            <p><strong>Candidate ID:</strong> {candidateId}</p>
            <p><strong>Round:</strong> {round}</p>
          </div>
          {/* Candidate Details Section */}
          {candidate && (
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h3 className="text-lg font-semibold mb-2">Candidate Details</h3>
              <p><strong>Name:</strong> {candidate.firstName} {candidate.lastName}</p>
              <p><strong>Email:</strong> {candidate.email}</p>
              <p><strong>Phone:</strong> {candidate.countryCode} {candidate.phoneNumber}</p>
              <p><strong>Qualification:</strong> {candidate.qualification}</p>
              <p><strong>Desired Role:</strong> {candidate.desiredRole}</p>
            </div>
          )}

          {/* Score Input */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Score (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="border p-3 rounded-md w-full"
            />
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Strengths (Optional)</label>
            <textarea
              className="border p-3 rounded-md w-full"
              placeholder="What did the candidate do well?"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </div>

          {/* Weaknesses */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Weaknesses (Optional)</label>
            <textarea
              className="border p-3 rounded-md w-full"
              placeholder="Areas for improvement?"
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
            />
          </div>

          {/* Overall Comments */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Overall Feedback (Required)</label>
            <textarea
              className="border p-3 rounded-md w-full"
              placeholder="Overall thoughts on the candidate's performance?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          
          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            <button style={{width:"75%"}} 
              type="submit"
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
              disabled={loading}
            >
              {loading ? "Submitting..." : initialFeedback ? "Update Feedback" : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default FeedbackForm;
