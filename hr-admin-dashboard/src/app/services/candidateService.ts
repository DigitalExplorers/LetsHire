import apiClient from "./apiClient";

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

interface RoundFeedbackPayload {
  candidateId: number | string;
  round: number | string;
  score: number | string;
  strengths: string;
  weaknesses: string;
  comments: string;
}

// Fetch Candidates List
export const getCandidates = async () => {
  try {
    const response = await apiClient.get("/candidates");

    // Exclude incomplete users
    if (response.data) {
      const filteredData = response.data.filter((candidate: any) => candidate.finalized === true);
      return filteredData;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};

// Fetch Candidate with id
export const getCandidate = async (id: string) => {
  try {
    const response = await apiClient.get(`/candidates/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidate:", error);
    throw error;
  }
};

// Create New Candidate
export const createCandidate = async (candidateData: string) => {
  try {
    const response = await apiClient.post("/candidates", candidateData);
    return response.data;
  } catch (error) {
    console.error("Error creating candidate:", error);
    throw error;
  }
};

// Update Candidate
export const updateCandidate = async (id: string, updatedData: string) => {
  try {
    const response = await apiClient.put(`/candidates/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating candidate:", error);
    throw error;
  }
};

// Delete Candidate
export const deleteCandidate = async (id: number) => {
  try {
    const response = await apiClient.delete(`/candidates/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting candidate:", error);
    throw error;
  }
};

// Update Candidate Status
export const updateCandidateStatus = async (id: string, status: string) => {
  try {
    const response = await apiClient.patch(`/candidates/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating candidate status:", error);
    throw error;
  }
};

export const addFeedback = async (candidateId: any, adminId: any, comment: string) => {
  const response = await apiClient.post(`/feedback/${candidateId}/${adminId}`, { comment });
  return response.data;
};

export const getFeedbacks = async (candidateId: any) => {
  const response = await apiClient.get(`/feedback/${candidateId}`);
  return response.data;
};

// Fetch available interviewers
export const getInterviewers = async () => {
  const response = await apiClient.get("/interviewers");
  return response.data;
};

// Fetch Single Candidate Details
export const getCandidateDetails = async (id: number) => {
  try {
    const response = await apiClient.get(`/candidates/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidate details:", error);
    throw error;
  }
};

// Assign an interviewer
export const assignInterviewer = async (candidateId: number, interviewerId: number) => {
  try {
    const response = await apiClient.patch(`/candidates/${candidateId}/assign-interviewer`, { interviewerId });
    return response.data;
  } catch (error) {
    console.error("Error assigning interviewer:", error);
    throw error;
  }
};

// Schedule an interview
export const scheduleInterview = async (candidateId: number, interviewerId: number, date: string) => {
  try {
    const response = await apiClient.patch(`/candidates/${candidateId}/schedule-interview`, {
      interviewerId: Number(interviewerId),
      date: new Date(date).toISOString(),
    });
    return response.data;
  } catch (error) {
    console.error("Error scheduling interview:", error);
    throw error;
  }
};

export const addFeedbackRoundWise = async ({
  candidateId,
  round,
  score,
  strengths,
  weaknesses,
  comments,
}: RoundFeedbackPayload) => {
  try {
    const response = await apiClient.post("/interviews/feedback", {
      candidateId: Number(candidateId),
      round: Number(round),
      score: Number(score),
      strengths,
      weaknesses,
      comments,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

export const fetchPreSignedUrl = async (fileKey: string, forceDownload: boolean = false) => {
  console.log("fetchPreSignedUrl key ", fileKey, "forceDownload =>", forceDownload);
  const encodedKey = encodeURIComponent(fileKey);
  const url = `/candidates/preSignedUrl/${encodedKey}${forceDownload ? "?download=true" : ""}`;
  console.log("fetchPreSignedUrl url", url);
  const response = await apiClient.get(url);
  console.log("fetchPreSignedUrl response", response.data);
  return response.data.url;
};
