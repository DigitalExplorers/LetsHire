"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, Maximize2, MessageSquare, Minimize2 } from "lucide-react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { fetchPreSignedUrl, getCandidate, updateCandidateStatus } from "../../app/services/candidateService";
import { getCandidateInterviewHistory } from "../services/interviewerService";
import Image from "next/image";
import ConfirmAction from "@/components/ConfirmAction";


interface Document {
  name: string;
  url: string;
  download_url?: string;
  view_url?: string;
}

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

// Extend Candidate Interface to Allow Extra Fields
interface TransformedCandidate extends Candidate {
  name: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  avatar: string;
  documents: Document[];
  scores: InterviewRound[]; // Update with proper type if known
  video: string | null;
  analytics: {
    Gender: string;
    Age: string;
    Expression: string;
    sentiment: string;
    speechRate: string;
    clarityScore: string;
    confidenceLevel: string;
    transcript: string;
  };
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



interface InterviewHistory {
  round: number;
  interviewer: { name: string };
  score: number | null;
  feedback: string | null;
}

// Function to get status color class
const getStatusClass = (status: string) => {
  const statusColors: Record<string, string> = {
    Applied: "bg-blue-300 text-blue-700",
    Screening: "bg-yellow-300 text-yellow-700",
    Shortlisted: "bg-green-300 text-green-700",
    "Interview Scheduled": "bg-indigo-300 text-indigo-700",
    "Interview Completed": "bg-cyan-300 text-cyan-700",
    InProgress: "bg-orange-300 text-orange-700",
    "Feedback Pending": "bg-red-300 text-red-700",
    Rejected: "bg-gray-300 text-gray-700",
    Hired: "bg-purple-300 text-purple-700",
  };
  return `inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${statusColors[status] || "bg-gray-300 text-gray-700"}`;
};

// Transform candidate data before setting state
const transformCandidateData = (data: Candidate): TransformedCandidate => {
  if (!data) {
    throw new Error("Invalid candidate data received");
  }
  // Function to extract the most repeated video analysis entry
  const getMostRepeatedAnalysis = (analysis: string[][]) => {
    const flatData: string[] = analysis.flat().filter(Boolean);
    if (flatData.length === 0) return "No Data Available";

    const countMap: Record<string, number> = flatData.reduce((acc, entry) => {
      acc[entry] = (acc[entry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(countMap).reduce((a, b) => (countMap[a] > countMap[b] ? a : b));
  };

  // Extract most repeated analysis data
  const mostRepeated = getMostRepeatedAnalysis(data.videoAnalysis?.result?.video_analysis || []);
  let gender = "N/A", age = "N/A", expression = "N/A";

  if (mostRepeated !== "No Data Available") {
    const matches = mostRepeated.match(/Gender:\s*(\w+),\s*Age:\s*\(([^)]+)\),\s*Expression:\s*(\w+)/);
    if (matches) {
      gender = matches[1] || "N/A";
      age = matches[2] || "N/A";
      expression = matches[3] || "N/A";
    }
  }

  const documents = [];

  if (data.resume) {
    documents.push({
      name: "Resume",
      url: data.resume,
    });
  }

  if (data.idProof) {
    documents.push({
      name: "ID Proof",
      url: data.idProof,
    });
  }


  return {
    ...data, // Preserve original fields
    name: `${data.firstName} ${data.lastName}`,
    age: "N/A",
    gender: "N/A",
    phone: `${data.countryCode} ${data.phoneNumber}`,
    address: data.currentCity || "N/A",
    avatar: "/images/user/user_avatar.png",
    documents: documents,
    scores: data.rounds as InterviewRound[],
    video: data.videoPath,
    analytics: {
        Gender: gender || "N/A",
        Age: age || "N/A",
        Expression: expression || "N/A",
        sentiment: data.videoAnalysis?.result?.audio_analysis?.tone_rating || "N/A",
        speechRate: `${data.videoAnalysis?.result?.audio_analysis?.fluency_metrics?.speech_speed_wpm || "N/A"} words per minute`,
        clarityScore: data.videoAnalysis?.result?.audio_analysis?.overall_rating_score || "N/A",
        confidenceLevel: data.videoAnalysis?.result?.audio_analysis?.fluency_rating || "N/A",
        transcript: data.videoAnalysis?.result?.audio_analysis?.transcript || "N/A"
    },
  };
};



const CandidateDetails = () => {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id");
  const [isFullScreen, setIsFullScreen] = useState(false);


  const [candidate, setCandidate] = useState<TransformedCandidate | null>(null);
  const [viewDocument, setViewDocument] = useState<string | null>(null);
  const [downloadDocument, setDownloadDocument] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (candidateId) {
      console.log("Fetching candidate with ID:", candidateId);
  
      const fetchCandidateData = async () => {
        try {
          const data = await getCandidate(candidateId);
          console.log("data ",data);
          const transformedData = transformCandidateData(data);
  
          // Fetch pre-signed URLs dynamically
          console.log("transformedData ",transformedData);
          const documentPromises = transformedData.documents.map(async (doc) => ({
            name: doc.name,
            url: doc.url,
            download_url: await fetchPreSignedUrl(doc.url, true), // Force download
            view_url: await fetchPreSignedUrl(doc.url), // Normal view
          }));
  
          console.log("documentPromises ",documentPromises);
          const videoUrl = transformedData.video
            ? await fetchPreSignedUrl(transformedData.video)
            : null;
  
          const updatedTransformedData = {
            ...transformedData,
            documents: await Promise.all(documentPromises),
            video: videoUrl,
          };
  
          setCandidate(updatedTransformedData);
          setSelectedStatus(updatedTransformedData.status);
        } catch (err) {
          console.error("Error fetching candidate:", err);
        }
      };
  
      const fetchInterviewHistory = async () => {
        try {
          const history = await getCandidateInterviewHistory(candidateId);
          setInterviewHistory(history);
        } catch (err) {
          console.error("Error fetching interview history:", err);
        }
      };
  
      fetchCandidateData();
      fetchInterviewHistory();
    }
  }, [candidateId, refresh]);

  useEffect(() => {
    const handleFocus = () => {
      setRefresh((prev) => !prev);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName); // This tells browser to download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!candidateId) return;

    const colorMap: Record<string, string> = {
      Applied: "#1c4ed8",
      Rejected: "#d33",
      Shortlisted: "#28a745",
      Hired: "#6f42c1",
      "Interview Scheduled": "#4e73df",
      "Interview Completed": "#17a2b8",
      "Feedback Pending": "#fd7e14",
    };

    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        try {
          await updateCandidateStatus(String(candidateId), newStatus);
          setSelectedStatus(newStatus);
        } finally {
          setIsLoading(false);
        }
      },
      title: `Change status to ${newStatus}`,
      message: `Are you sure you want to mark this candidate as ${newStatus}?`,
      confirmText: `Yes, mark as ${newStatus}`,
      confirmColor: colorMap[newStatus] || "#0d6efd",
    });
  };




  if (!candidate) return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="text-center">
        <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto animate-spin"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <DefaultLayout isLoading={isLoading}>
      <div className="w-full bg-white p-6 rounded-lg shadow">
        <Breadcrumb pageName="Candidate Details" />
        <div className="mb-4">
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
          >
            ← Back
          </button>
        </div>
        <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {/* Profile Section */}
      {/* <div className="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center md:items-start space-x-4">
        <img
          src={candidate.avatar || "/default-avatar.png"}
          alt="Profile Picture"
          className="w-24 h-24 rounded-full border mb-4 md:mb-0"
        />
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-semibold">{candidate.name}</h2>
          <p className="text-gray-600">{candidate.status.replace("InProgress", "In Progress")}</p>
          <p className="text-blue-600"><a href={`mailto:${candidate.email}`}>{candidate.email}</a></p>
          <p className="text-blue-600"><a href={`tel:${candidate.phone}`}>{candidate.phone}</a></p>
        </div>
      </div> */}

      {/* Profile Section */}
        <div className="flex flex-col md:flex-row justify-between items-start bg-gray-100 p-6 rounded-lg shadow-md">
          {/* Left - Candidate Info */}
          <div className="flex items-start space-x-4">
            <Image
              src={candidate.avatar || "/default-avatar.png"}
              alt="Profile Picture"
              width={96}
              height={96}
              className="rounded-full border"
            />
            <div className="text-left">
              <h2 className="text-2xl font-semibold">{candidate.name}</h2>
              <p className="text-blue-600">
                <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
              </p>
              <p className="text-blue-600">
                <a href={`tel:${candidate.phone}`}>{candidate.phone}</a>
              </p>
              <div className="relative w-48 mt-2">
                <div className={`${getStatusClass(selectedStatus)} w-full px-4 py-2 border rounded-lg text-center`}>
                  {selectedStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Status Display and Dropdown */}
          <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2 w-full md:w-auto md:ml-auto">
            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Update Status</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Interview Completed">Interview Completed</option>
              <option value="Feedback Pending">Feedback Pending</option>
              <option value="Hired">Hired</option>
            </select>
          </div>
        </div>

      {/* Interview History Table */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Interview History</h3>
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Round</th>
              <th className="p-2 text-left">Interviewer</th>
              <th className="p-2 text-left">Score</th>
              <th className="p-2 text-left">Feedback</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {interviewHistory?.length > 0 ? (
              interviewHistory.map((round, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">Round {round.round}</td>
                  <td className="p-2">{round.interviewer?.name || "N/A"}</td>
                  {/* <td className="p-2">{round.score ?? "N/A"}</td> */}
                  {/* <td className="p-2">
                    {round.score !== null ? (
                      <Link
                        href={`/candidate/test-attempt?id=${candidateId}`}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {round.score}
                      </Link>
                    ) : (
                      "N/A"
                    )}
                  </td> */}
                  <td className="p-2">
                    {round.score !== null ? (
                      !round.interviewer ? (
                        <Link
                          href={`/candidate/test-attempt?id=${candidateId}&round=${round.round}`}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {round.score??'N/A'}
                        </Link>
                      ) : (
                        <span>{round.score}</span>
                      )
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="p-2 whitespace-pre-line">{round.feedback || "No feedback yet"}</td>
                  <td className="p-2">
                    <Link
                      href={`/interview/interview-feedback-form?id=${candidateId}&round=${round.round}&feedback=${encodeURIComponent(round.feedback || '')}&score=${round.score || ''}`}
                      // href={`/interview/interview-feedback-form?id=${candidateId}&round=${round.round}`}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md flex items-center"
                    >
                      <MessageSquare size={16} className="mr-2" /> {round.feedback ? "Edit Feedback" : "Add Feedback"}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-4">No interview history available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Uploaded Documents */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
          {candidate.documents.map((doc:Document, index:number) => (
            <div key={index} className="flex items-center justify-between border p-2 rounded-md mb-2">
              <span>{doc.name}</span>
              <button
                onClick={() => {
                  setViewDocument(doc.view_url ?? null);
                  setDownloadDocument(doc.download_url ?? null);
                }}
                className="text-blue-600 flex items-center"
              >
                <Eye size={16} className="mr-1" /> View
              </button>
              <button
                onClick={() => handleDownload(doc.download_url ?? doc.url, "Resume")}
                className="ml-2 text-blue-500"
              >
                Download
              </button>
            </div>
          ))}
        </div>

        {/* Video Recording with AI Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Demo Graphics</h3>
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <p><strong>Gender:</strong> {candidate.analytics.Gender}</p>
            <p><strong>Age:</strong> {candidate.analytics.Age}</p>
            <p><strong>Expression:</strong> {candidate.analytics.Expression}</p>
            <p><strong>Sentiment:</strong> {candidate.analytics.sentiment}</p>
            {/* <p><strong>Key Topics:</strong> {candidate.analytics.keywords.join(", ")}</p> */}
            <p><strong>Speech Rate:</strong> {candidate.analytics.speechRate}</p>
            <p><strong>Clarity Score:</strong> {candidate.analytics.clarityScore}/10</p>
            <p><strong>Confidence Level:</strong> {candidate.analytics.confidenceLevel}</p>
          </div>
          <video controls className="w-full h-40 rounded-md shadow-lg">
            <source src={candidate.video ?? undefined} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Feedbacks Section */}
        {/* <div style={{height:'28rem'}} className="bg-white p-6 rounded-lg shadow-md mt-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Submitted Feedbacks</h3>
              <Link
                href={`/candidate/feedback-form?id=${candidateId}`}
                className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                <PlusCircle size={18} className="mr-2" /> Add Feedback
              </Link>
            </div>
            {feedbacks.length > 0 ? (
              <div className="space-y-4 overflow-y-auto">
                {feedbacks.map((feedback, index) => (
                  <div key={index} className="p-4 border rounded-md shadow-sm bg-gray-50">
                    <p className="text-gray-500 text-sm">
                      {new Date(feedback.createdAt).toLocaleString()} - {feedback.submittedBy?.name}
                    </p>
                    <p className="mt-2 text-gray-800">{feedback.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No feedback submitted yet.</p>
            )}
          </div> */}

      </div>

      {viewDocument 
      && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-end p-4 z-999">
          <div 
            className={`bg-white p-6 rounded-lg shadow-lg flex flex-col transition-all relative max-w-screen-xl w-full md:w-4/5 ${
              isFullScreen ? "h-full" : "h-[80vh]"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Document Preview</h2>
            </div>
            <iframe 
              src={viewDocument} 
              className="w-full flex-1 border rounded-lg shadow h-full"
            ></iframe>
            <div className="mt-4 flex justify-between">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="bg-gray-500 text-white px-3 py-2 rounded-md flex items-center"
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />} 
                {isFullScreen ? "Exit Full Screen" : "Full Screen"}
              </button>
              <button 
                onClick={() => setViewDocument(null)} 
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
              <button 
                onClick={() => downloadDocument && handleDownload(downloadDocument, "Resume")}
                className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
                disabled={!downloadDocument}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
      </div>
    </DefaultLayout>
  );
};

export default CandidateDetails;
