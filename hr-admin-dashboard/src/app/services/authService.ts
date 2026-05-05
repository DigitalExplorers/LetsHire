"use client";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

// Sign Up API Call
// export const signUp = async (name: string, email: string, password: string, organizationName: string) => {
//   return axios.post(`${API_URL}/auth/signup`, { name, email, password, organizationName });
// };
export const signUp = async (
  name: string,
  email: string,
  password: string,
  organizationName: string
) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, {
      name,
      email,
      password,
      organizationName,
    });
    return response.data;
  } catch (err: any) {
    // Capture server error message if available
    const message =
      err.response?.data?.message || "Signup failed. Please try again.";
    throw new Error(message);
  }
};

// Sign In API Call
export const loginUser = async (email: string, password: string) => {
  email = email.toLowerCase()
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  localStorage.setItem("token", response.data.access_token); // Store JWT token
  return response.data;
};

// Log Out Function
export const logoutUser = () => {

  if (typeof window !== "undefined") {
    document.documentElement.style.setProperty("--color-primary", "190 30 45"); 
  }
  localStorage.clear();
  Cookies.remove("token");
  Cookies.remove("role");
  Cookies.remove("organizationId");
  Cookies.remove("id");
  window.location.href = "/auth/signin";
};

// Fetch Current User (Optional)
export const getUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired or unauthorized, clear localStorage and reload
      localStorage.removeItem("token");
      window.location.href = "/auth/signin"; // Redirect to login page
    }
    return null;
  }
};

export const sendResetLink = async (email: string) => {
  try {
    await axios.post(`${API_URL}/auth/forgot-password`, { email });
  } catch (err) {
    console.error("Reset link request error:", err);
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, {
    token,
    newPassword,
  });
  return response.data;
};
