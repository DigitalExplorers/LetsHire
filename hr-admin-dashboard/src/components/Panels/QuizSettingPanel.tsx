"use client";

import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import Cookies from "js-cookie";

interface QuizSettingPanelProps {
  roleId: number;
  roleName: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

const QuizSettingPanel = ({ roleId, roleName }: QuizSettingPanelProps) => {
  const [numQuestions, setNumQuestions] = useState<number | string>(1);
  const [timePerQuestion, setTimePerQuestion] = useState<number | string>(45);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const token = Cookies.get("token");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/quiz/config?roleId=${roleId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch configuration");
        const data = await response.json();
        setNumQuestions(data.numberOfQuestions > 0 ? data.numberOfQuestions : 1);
        setTimePerQuestion(data.timePerQuestionInSeconds > 0 ? data.timePerQuestionInSeconds : 45);
      } catch (error) {
        toast.error("Failed to load configuration. Defaulting to default values.");
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [roleId]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumQuestions(value === "" ? "" : Number(value));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimePerQuestion(value === "" ? "" : Number(value));
  };

  const handleBlur = () => {
    if (numQuestions === "" || Number(numQuestions) < 1) setNumQuestions(1);
    if (timePerQuestion === "" || Number(timePerQuestion) < 10) setTimePerQuestion(10);
  };

  const handleConfigUpdate = async () => {
    if (Number(numQuestions) < 1 || Number(timePerQuestion) < 10) {
      toast.error("Number of questions must be at least 1 and time per question must be at least 10 seconds.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/quiz/config?roleId=${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numberOfQuestions: Number(numQuestions),
          timePerQuestionInSeconds: Number(timePerQuestion),
        }),
      });

      if (!response.ok) throw new Error("Failed to update configuration");
      toast.success("Configuration updated successfully!");
    } catch (error) {
      toast.error("Failed to update configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-center" autoClose={3000} />
      <h2 className="text-lg font-semibold mb-4 text-black">Quiz Settings</h2>
      <p className="text-gray-600 mb-3"><strong>Role:</strong> {roleName}</p>
      <label className="block mb-2 font-medium text-gray-700">
        Number of Questions to Display
      </label>
      <input
        type="number"
        min="1"
        max="100"
        value={numQuestions}
        onChange={handleNumberChange}
        onBlur={handleBlur}
        className="w-full rounded-md border px-3 py-2 mb-4"
      />

      <label className="block mb-2 font-medium text-gray-700">
        Time Per Question (in seconds)
      </label>
      <input
        type="number"
        min="10"
        max="600"
        value={timePerQuestion}
        onChange={handleTimeChange}
        onBlur={handleBlur}
        className="w-full rounded-md border px-3 py-2 mb-4"
      />

      <button
        onClick={handleConfigUpdate}
        disabled={isSaving || loadingConfig}
        className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90 disabled:opacity-60"
      >
        {loadingConfig ? "Loading..." : isSaving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  );
};

export default QuizSettingPanel;
