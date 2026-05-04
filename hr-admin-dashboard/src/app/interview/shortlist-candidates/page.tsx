"use client";

import { useEffect, useState } from "react";
import { ArrowDownUp, ArrowUpDown, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { Menu } from "@headlessui/react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { getCandidates, assignInterviewer, scheduleInterview, getCandidateDetails, getInterviewers, updateCandidateStatus } from "../../../app/services/candidateService";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useRouter } from "next/navigation";
import React from "react";
import ConfirmAction from "@/components/ConfirmAction";
import { toast, ToastContainer } from "react-toastify";
import DropdownActions from "@/components/DropdownActions";


interface Document {
  name: string;
  url: string;
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
  status: "Applied" | "Screening" | "Shortlisted" | "Interview Scheduled" | "Interview Completed" | "InProgress" | "Feedback Pending" | "Rejected" | "Hired";
  videoPath: string | null;
  videoAnalysis: VideoAnalysis | null;
  interviewScheduledAt?: string;
  assignedInterviewer?: Pick<Interviewer, "id" | "name"> | null;
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
  status: "Applied" | "Screening" | "Shortlisted" | "Interview Scheduled" | "Interview Completed" | "InProgress" | "Feedback Pending" | "Rejected" | "Hired";
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
  date: string;
  formattedInterviewDate: string;
  interviewerName: string;
  phone: string;
  address: string;
  avatar: string;
  documents: Document[];
  scores: InterviewRound[];
  video: string;
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
    video_analysis?: string[][];
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

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB");
};

const formatDateTime = (isoDate: string) => {

  if (!isoDate) return "Not Scheduled";

  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) + " " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const ShortListCandidates = () => {
  const [candidates, setCandidates] = useState<TransformedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<TransformedCandidate | null>(null);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"name" | "date">("name");



  // Filter Interviewers Safely
  const filteredCandidates = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination Logic
  // const sortedCandidates = [...filteredCandidates].sort((a, b) => {
  //   const nameA = a.name.toLowerCase();
  //   const nameB = b.name.toLowerCase();
  //   return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  // });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortField === "name") {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortField === "date") {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });


  const totalCandidates = sortedCandidates.length;
  const totalPages = Math.ceil(totalCandidates / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCandidates);
  const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);

  // const handleSortToggle = () => {
  //   setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  // };

  const handleSortToggle = (field: "name" | "date") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };


  const router = useRouter();
  const candidateView = (candidateId: number) => {
    router.push(`/candidate?id=${candidateId}`); // Navigate to new page
  };


  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchInterviewers();
  }, []);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data: TransformedCandidate[] = await getCandidates();

      const filteredCandidates: TransformedCandidate[] = data.filter(
        (candidate: TransformedCandidate) =>
          !["Hired", "Rejected", "Applied"].includes(candidate.status) // Exclude specific statuses
      );

      // Process data and transform into TransformedCandidate[]
      const processedData: TransformedCandidate[] = filteredCandidates.map((candidate) => ({
        ...candidate,
        name: `${candidate.firstName} ${candidate.lastName}`,
        phone: `${candidate.countryCode} ${candidate.phoneNumber}`,
        date: formatDate(candidate.createdAt),
        status: candidate.status,
      }));
      setCandidates(processedData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const data = await getInterviewers();
      setInterviewers(data);
    } catch (error) {
      console.error("Error fetching interviewers:", error);
    }
  };

  const handleRowClick = async (candidateId: number) => {
    try {
      // Explicitly define type for details
      const details: TransformedCandidate = await getCandidateDetails(candidateId);

      // Create a new object instead of mutating details directly
      const formattedDetails: TransformedCandidate = {
        ...details,
        name: `${details.firstName} ${details.lastName}`,
        phone: `${details.countryCode} ${details.phoneNumber}`,
        date: formatDate(details.createdAt),
        formattedInterviewDate: formatDateTime(details.interviewScheduledAt ?? ""),
        interviewerName: details.assignedInterviewer ? details.assignedInterviewer.name : "Not Assigned",
      };

      // Set state safely
      setScheduledDate(details.interviewScheduledAt ? details.interviewScheduledAt.slice(0, 16) : "");
      setSelectedCandidate(formattedDetails);
      setIsSidebarOpen(true);
    } catch (error) {
      console.error("Error fetching candidate details:", error);
    }
  };


  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);


  // Function to Assign Interviewer and Schedule Interview at the Same Time
  const handleAssignAndSchedule = async () => {
    if (!selectedCandidate) {
      setErrorMessage("No candidate selected.");
      return;
    }

    if (!selectedInterviewer) {
      setErrorMessage("Please select an interviewer.");
      return;
    }

    if (!scheduledDate) {
      setErrorMessage("Please select an interview date.");
      return;
    }

    try {
      // Update Local State Immediately**
      setCandidates((prevCandidates) =>
        prevCandidates.map((candidate) =>
          candidate.id === selectedCandidate.id
            ? {
              ...candidate,
              assignedInterviewer: {
                id: selectedInterviewer.id,
                name: selectedInterviewer.name,
              },
              interviewScheduledAt: scheduledDate,
              status: "Interview Scheduled",
            }
            : candidate
        )
      );

      // Also update selected candidate
      setSelectedCandidate((prev) =>
        prev
          ? {
            ...prev,
            assignedInterviewer: { id: selectedInterviewer.id, name: selectedInterviewer.name },
            interviewScheduledAt: scheduledDate,
            status: "Interview Scheduled",
          }
          : null
      );
      // Immediately update UI and close sidebar before API calls
      setIsSidebarOpen(false);

      // Show success message
      toast.success("Interview scheduled successfully!", {});

      // Call APIs concurrently for better performance
      await Promise.all([
        assignInterviewer(selectedCandidate.id, selectedInterviewer.id),
        scheduleInterview(selectedCandidate.id, selectedInterviewer.id, scheduledDate),
      ]);
      // Then set final status after both are done
      await updateCandidateStatus(String(selectedCandidate.id), "Interview Scheduled");

    } catch (error) {
      console.error("Error assigning and scheduling interview:", error);
      toast.error("Failed to schedule interview. Please try again.");
    }
  };

  const filteredInterviewers = interviewers.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.skills ?? []).some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRejectCandidate = async (id: number, newStatus: string) => {
    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        await updateCandidateStatus(String(id), newStatus);
        fetchCandidates();
      },
      title: `Change status to ${newStatus}`,
      message: `Are you sure you want to mark this candidate as ${newStatus}?`,
      confirmText: `Yes, mark as ${newStatus}`,
      confirmColor: "#d33",
    });
  };

  const handleInterviewCompletedCandidate = async (id: number, newStatus: string) => {
    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        await updateCandidateStatus(String(id), newStatus);
        fetchCandidates();
      },
      title: `Change status to ${newStatus}`,
      message: `Are you sure you want to mark this candidate as ${newStatus}?`,
      confirmText: `Yes, mark as ${newStatus}`,
      confirmColor: "#d33",
    });
  };

  const handleHiredCandidate = async (id: number, newStatus: string) => {
    await ConfirmAction({
      action: async () => {
        setIsLoading(true);
        await updateCandidateStatus(String(id), newStatus);
        fetchCandidates();
      },
      title: `Change status to ${newStatus}`,
      message: `Are you sure you want to mark this candidate as ${newStatus}?`,
      confirmText: `Yes, mark as ${newStatus}`,
      confirmColor: "#28a745",
    });
  };

  return (
    <>
      <DefaultLayout isLoading={isLoading}>
        <Breadcrumb pageName="Assign Interviewer & Schedule" />
        <div className="rounded-lg border bg-white p-5 shadow-md w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
            {/* <h3 className="text-lg font-semibold text-black">Hired Candidates</h3> */}
            <input
              type="text"
              placeholder="Search by name..."
              className="border px-3 py-2 rounded-lg text-black w-full md:w-1/3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

            <>
              {/* {paginatedCandidates.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-gray-500 text-lg">No candidates found.</span>
                </div>
              ) : (
                <> */}
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-max table-auto border-collapse border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          {/* <th onClick={handleSortToggle} className="px-4 py-3 text-left cursor-pointer">
                            Name {sortOrder === "asc" ? "▲" : "▼"}
                          </th> */}
                          {/* <th
                            className="px-4 py-3 text-left cursor-pointer select-none"
                            onClick={handleSortToggle}
                          >
                            Name{" "}
                            {sortOrder === "asc" ? (
                              <ArrowUpDown size={14} className="inline ml-1" />
                            ) : (
                              <ArrowDownUp size={14} className="inline ml-1" />
                            )}
                          </th> */}
                          <th
                            className="px-4 py-3 text-left cursor-pointer select-none"
                            onClick={() => handleSortToggle("name")}
                          >
                            Name{" "}
                            {sortField === "name" ? (
                              sortOrder === "asc" ? (
                                <ArrowUpDown size={14} className="inline ml-1" />
                              ) : (
                                <ArrowDownUp size={14} className="inline ml-1" />
                              )
                            ) : (
                              <ArrowUpDown size={14} className="inline ml-1 text-gray-400" />
                            )}
                          </th>


                          <th className="px-4 py-3 text-left">Role</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Interviewer</th>
                          {/* <th className="px-4 py-3 text-left">Interview Date</th> */}
                          <th
                            className="px-4 py-3 text-left cursor-pointer select-none"
                            onClick={() => handleSortToggle("date")}
                          >
                            Date{" "}
                            {sortField === "date" ? (
                              sortOrder === "asc" ? (
                                <ArrowUpDown size={14} className="inline ml-1" />
                              ) : (
                                <ArrowDownUp size={14} className="inline ml-1" />
                              )
                            ) : (
                              <ArrowUpDown size={14} className="inline ml-1 text-gray-400" />
                            )}
                          </th>

                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                      {paginatedCandidates.length > 0 ? (
                        paginatedCandidates.map((candidate, index) => (
                          <tr
                            key={index}
                            className="border-t"
                          >
                            <td className="px-4 py-3 cursor-pointer" onClick={() => candidateView(candidate.id)}>{candidate.name}</td>
                            <td className="px-4 py-3">{candidate.desiredRole}</td>
                            {/* <td className="px-4 py-3">{candidate.status}</td> */}
                            <td className="px-4 py-3">
                              <p
                                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${candidate.status === "Applied"
                                  ? "bg-blue-300 text-blue-700"
                                  : candidate.status === "Screening"
                                    ? "bg-yellow-300 text-yellow-700"
                                    : candidate.status === "Shortlisted"
                                      ? "bg-green-300 text-green-700"
                                      : candidate.status === "Interview Scheduled"
                                        ? "bg-indigo-300 text-indigo-700"
                                        : candidate.status === "Interview Completed"
                                          ? "bg-cyan-300 text-cyan-700"
                                          : candidate.status === "InProgress"
                                            ? "bg-orange-300 text-orange-700"
                                            : candidate.status === "Feedback Pending"
                                              ? "bg-red-300 text-red-700"
                                              : candidate.status === "Rejected"
                                                ? "bg-gray-300 text-gray-700"
                                                : candidate.status === "Hired"
                                                  ? "bg-purple-300 text-purple-700"
                                                  : "bg-gray-300 text-gray-700"
                                  }`}
                              >
                                {candidate.status === "InProgress" ? "In Progress" : candidate.status}
                              </p>
                            </td>
                            <td className="px-4 py-3">{candidate.assignedInterviewer ? candidate.assignedInterviewer.name : "Not Assigned"}</td>

                            <td className="px-4 py-3">{candidate.interviewScheduledAt ? formatDateTime(candidate.interviewScheduledAt) : "Not Scheduled"}</td>
                            <td className="px-4 py-3">
                              <DropdownActions
                                trigger={({ onClick, ref }) => (
                                  <button className="p-2" onClick={onClick} ref={ref}>
                                    <MoreVertical size={18} />
                                  </button>
                                )}
                                items={({ close }) => (
                                  <div className="py-1">
                                    <button
                                      className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                      onClick={() => {
                                        candidateView(candidate.id);
                                        close();
                                      }}
                                    >
                                      View Details
                                    </button>

                                    <button
                                      className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                      onClick={() => {
                                        handleRowClick(candidate.id);
                                        close();
                                      }}
                                    >
                                      Assign & Schedule Interview
                                    </button>

                                    <button
                                      className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                      onClick={() => {
                                        handleInterviewCompletedCandidate(candidate.id, "Interview Completed");
                                        close();
                                      }}
                                    >
                                      Interview Completed
                                    </button>

                                    <button
                                      className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                      onClick={() => {
                                        handleHiredCandidate(candidate.id, "Hired");
                                        close();
                                      }}
                                    >
                                      Hired
                                    </button>

                                    <button
                                      className="block w-full text-left px-4 py-2 hover:bg-gray-200 text-red-500"
                                      onClick={() => {
                                        handleRejectCandidate(candidate.id, "Rejected");
                                        close();
                                      }}
                                    >
                                      Rejected
                                    </button>
                                  </div>
                                )}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="border p-4 text-center text-gray-500">No interviewers found.</td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm">Showing {startIndex}-{endIndex} of {totalCandidates}</span>
                    <div className="flex space-x-2">
                      <button onClick={handlePreviousPage} disabled={currentPage === 1} className={`px-3 py-1 border rounded-md ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}>
                        Prev
                      </button>
                      <button onClick={handleNextPage} disabled={currentPage === totalPages} className={`px-3 py-1 border rounded-md ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}>
                        Next
                      </button>
                    </div>
                  </div>
                {/* </>
              )} */}
            </>
        </div>
      </DefaultLayout>

      {isSidebarOpen && selectedCandidate && (
        <div className="fixed inset-0 flex justify-end z-50">
          {/* Background Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Right-Side Panel with Scrolling Fix */}
          <div
            style={{ top: "5rem", paddingBottom: "2rem" }}
            className="relative w-full sm:w-2/3 md:w-1/2 lg:w-1/3 h-[90vh] bg-white shadow-lg p-5 transition-transform transform translate-x-0 overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick={() => setIsSidebarOpen(false)}
            >
              ✖
            </button>

            {/* Scrollable Content Wrapper */}
            <div className="overflow-y-auto flex-1 pr-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Candidate Details</h2>

              <p><strong>Name:</strong> {selectedCandidate.name}</p>
              <p><strong>Email:</strong> {selectedCandidate.email}</p>
              <p><strong>Phone:</strong> {selectedCandidate.phone}</p>
              <p><strong>Current Interviewer:</strong> {selectedCandidate.interviewerName || "Not Assigned"}</p>
              <p><strong>Interview Date:</strong> {selectedCandidate.formattedInterviewDate || "Not Scheduled"}</p>

              {/* Search & Select Interviewer */}
              <h3 className="mt-4 font-semibold">Select Interviewer</h3>
              <input
                type="text"
                placeholder="Search by Name or Skill"
                className="border p-2 rounded-md w-full mb-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="overflow-y-auto max-h-48 mt-1 border rounded-md p-2">
                {filteredInterviewers.map((interviewer) => (
                  <label key={interviewer.id} className="flex items-center justify-start p-2 border-b cursor-pointer">
                    <input
                      type="radio"
                      name="selectedInterviewer"
                      value={interviewer.id}
                      checked={selectedInterviewer?.id === interviewer.id}
                      onChange={() => setSelectedInterviewer(interviewer)}
                      className="mr-2"
                    />
                    <span>{interviewer.name}</span>
                  </label>
                ))}
              </div>

              {/* Interview Scheduling Section */}
              <h3 className="mt-4 font-semibold">Schedule Interview</h3>
              {/* <input
          type="datetime-local"
          className="border p-2 rounded-md w-full"
          value={scheduledDate || selectedCandidate?.interviewScheduledAt || ""}
          onChange={(e) => setScheduledDate(e.target.value)}
        /> */}
              <div
                className="border p-2 rounded-md w-full cursor-pointer"
                onClick={() => {
                  const input = document.getElementById("scheduleInput") as HTMLInputElement;
                  if (input) input.showPicker();
                }}
              >
                <input
                  id="scheduleInput"
                  type="datetime-local"
                  className="w-full bg-transparent focus:outline-none"
                  value={scheduledDate || selectedCandidate?.interviewScheduledAt || ""}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              {errorMessage && <p className="mt-2 text-red-600 text-sm">{errorMessage}</p>}

              {/* Assign & Schedule Button */}
              <button
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
                onClick={handleAssignAndSchedule}
              >
                Assign & Schedule
              </button>
            </div>
          </div>
        </div>
      )}



    </>
  );
};

export default ShortListCandidates;
