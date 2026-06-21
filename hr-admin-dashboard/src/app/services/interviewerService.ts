import apiClient from "./apiClient";

// Fetch all Interviewers
export const getInterviewers = async () => {
  try {
    const response = await apiClient.get("/interviewers");
    return response.data;
  } catch (error) {
    console.error("Error fetching interviewers:", error);
    throw error;
  }
};

// Fetch Single Interviewer by ID
export const getInterviewer = async (id: any) => {
  try {
    const response = await apiClient.get(`/interviewers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching interviewer:", error);
    throw error;
  }
};

// Create a New Interviewer
export const createInterviewer = async (interviewerData: any) => {
  try {
    const response = await apiClient.post("/interviewers", interviewerData);
    return response.data;
  } catch (error) {
    console.error("Error creating interviewer:", error);
    throw error;
  }
};

// Update an Existing Interviewer
export const updateInterviewer = async (id: any, updatedData: any) => {
  try {
    const response = await apiClient.put(`/interviewers/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating interviewer:", error);
    throw error;
  }
};

// Delete an Interviewer
export const deleteInterviewer = async (id: any) => {
  try {
    const response = await apiClient.delete(`/interviewers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting interviewer:", error);
    throw error;
  }
};

// Fetch Available Interviewers Based on Skills
export const getAvailableInterviewers = async (skills: string) => {
  try {
    const response = await apiClient.get(`/interviewers?skills=${skills}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching available interviewers:", error);
    throw error;
  }
};

// Assign an Interviewer to an Interview
export const assignInterviewer = async (interviewId: any, interviewerId: any) => {
  try {
    const response = await apiClient.post("/interviews/assign", { interviewId, interviewerId });
    return response.data;
  } catch (error) {
    console.error("Error assigning interviewer:", error);
    throw error;
  }
};

// Fetch Candidates assigned to an Interviewer
export const getCandidatesByInterviewer = async (interviewerId: string) => {
  try {
    const response = await apiClient.get(`/interviews/interviewer/${interviewerId}/candidates`);
    return response.data;
  } catch (error) {
    console.error("Error fetching interviewers:", error);
    throw error;
  }
};

export const submitFeedback = async (interviewId: number, feedback: string, score: any) => {
  try {
    const response = await apiClient.post(`/interviews/feedback/${interviewId}`, { feedback, score });
    return response.data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

export const promoteCandidate = async (
  candidateId: string | number,
  interviewerId: string | number,
  date: any,
) => {
  try {
    const response = await apiClient.post("/interviews/promote", { candidateId, interviewerId, date });
    return response.data;
  } catch (error) {
    console.error("Error promoting candidate:", error);
    throw error;
  }
};

// Fetch Interview History for a Candidate
export const getCandidateInterviewHistory = async (interviewerId: string) => {
  try {
    const response = await apiClient.get(`/interviews/candidate/${interviewerId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching interviewers:", error);
    throw error;
  }
};
