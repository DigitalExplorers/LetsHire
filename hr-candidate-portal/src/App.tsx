import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from "react-router-dom";
import './App.css';

import RegistrationForm from './components/RegistrationForm';
import OnboardScreen from "./components/Onboarding";
import VideoScreening from "./components/VideoScreening";
import VideoScreeningTwo from "./components/VideoScreeningTwo";
import VideoRecorder from "./components/VideoRecorder";
import ThankYouScreen from "./components/ThankYouScreen";
import OtpPage from "./components/OTPScreen";
import TestBegin from "./components/TestInstructionScreen";
import QuizPage from "./components/Quiz";
import ScoreBoard from "./components/ScoreBoard";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme/theme";

// Import your Branding Provider
import { BrandingProvider } from "./contexts/BrandingContext";

// Import DeviceChecker
import DeviceChecker from "./components/DeviceChecker";
import ProtectedExamWindow from "./components/ProtectedExamWindow";
import ExamEntryPage from "./components/ExamEntryPage";
// import UnsupportedPage from "./components/UnsupportedPage";

// AppRoutes stays the same
const AppRoutes = () => {
  const location = useLocation();

  // Try to match /registration/:token, /otp/:token, etc.
  const nestedMatch = matchPath("/:type/:token", location.pathname);
  // Fallback for /:token (e.g., Onboarding screen)
  const fallbackMatch = matchPath("/:token", location.pathname);

  const token = nestedMatch?.params.token || fallbackMatch?.params.token;

  return (
    <BrandingProvider token={token}>
      <ScrollToTop />
      <Routes>
        <Route path="/registration/:token"
          element={
            <ProtectedExamWindow>
              <RegistrationForm />
            </ProtectedExamWindow>
          } 
        />
        <Route
          path="/otp/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<OtpPage />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/begin-test/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<TestBegin />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/test/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<QuizPage />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/video-screening/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<VideoScreening />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/video-screening2/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<VideoScreeningTwo />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/video-recorder/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<VideoRecorder />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/thank-you/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<ThankYouScreen />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/result/:token"
          element={
            <ProtectedExamWindow>
              <ProtectedRoute element={<ScoreBoard />} />
            </ProtectedExamWindow>
          }
        />
        <Route
          path="/onboard/:token"
          element={
            <ProtectedExamWindow>
              <OnboardScreen />
            </ProtectedExamWindow>
          }
        />
        <Route path="/:token" element={<ExamEntryPage />} />

        {/* <Route path="/otp/:token" element={<ProtectedRoute element={<OtpPage />} />} /> */}
        {/* <Route path="/begin-test/:token" element={<ProtectedRoute element={<TestBegin />} />} />
        <Route path="/test/:token" element={<ProtectedRoute element={<QuizPage />} />} />
        <Route path="/video-screening/:token" element={<ProtectedRoute element={<VideoScreening />} />} />
        <Route path="/video-screening2/:token" element={<ProtectedRoute element={<VideoScreeningTwo />} />} />
        <Route path="/video-recorder/:token" element={<ProtectedRoute element={<VideoRecorder />} />} />
        <Route path="/thank-you" element={<ProtectedRoute element={<ThankYouScreen />} />} />
        <Route path="/result/:token" element={<ProtectedRoute element={<ScoreBoard />} />} />
        <Route path="/onboard/:token" element={<OnboardScreen />} />
        // <Route path="/:token" element={<ExamEntryPage />} /> */}
        {/* <Route path="/unsupported" element={<UnsupportedPage />} /> */}
      </Routes>
    </BrandingProvider>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        {/* Wrap the entire app with DeviceChecker */}
        <DeviceChecker>
          <AppRoutes />
        </DeviceChecker>
      </Router>
    </ThemeProvider>
  );
}

export default App;
