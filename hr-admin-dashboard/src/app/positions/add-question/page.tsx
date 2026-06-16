"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
const QuestionsForm = () => {

  const token = Cookies.get("token");
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number|"">("");
  const [selectedRoleName, setSelectedRoleName] = useState<string | "">("");

  const searchParams = useSearchParams();
  const roleIdFromQuery = searchParams.get("roleId");
  const roleNameFromQuery = searchParams.get("roleName");


  useEffect(() => {
    if (roleIdFromQuery) {
      setSelectedRoleId(parseInt(roleIdFromQuery));
    }
    if (roleNameFromQuery) {
      setSelectedRoleName(roleNameFromQuery);
    }
  }, [roleIdFromQuery, roleNameFromQuery]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.some((opt) => opt === "") || !correctAnswer) {
      alert("All fields are required!");
      return;
    }

    // Construct the correct payload for backend
    const formattedOptions = options.map((opt) => ({
      text: opt,
      isCorrect: opt === correctAnswer, // Mark correct answer
    }));

    const questionData = { question, options: formattedOptions };

    try {
      const response = await fetch(`${API_URL}/quiz/add-question?roleId=${selectedRoleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error("Failed to save question");
      console.log("Question Added Successfully!");
      router.push(`/positions/question-view?roleId=${selectedRoleId}&roleName=${selectedRoleName}`);
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question. Please try again.");
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Add New Question" />

      <div>
        <button onClick={() => router.back()} style={{ height: '47px' }} className="bg-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 text-gray-800">← Back</button>
      </div>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg dark:bg-boxdark">
        <h3 className="text-lg font-bold mb-4">Add Question to {selectedRoleName}</h3>
        <form onSubmit={handleSubmit}>
          {/* Question Input */}
          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Question <span className="text-meta-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter the question"
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          {/* Options Inputs */}
          {options.map((opt, index) => (
            <div key={index} className="mb-4.5">
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Option {index + 1} <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                placeholder={`Enter option ${index + 1}`}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
            </div>
          ))}

          {/* Correct Answer Selection */}
          <div className="mb-4.5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Correct Answer <span className="text-meta-1">*</span>
            </label>
            <select
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            >
              <option value="">Select the correct answer</option>
              {options.map((opt, index) => (
                <option key={index} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90">
            Save Question
          </button>
        </form>
      </div>
    </DefaultLayout>
  );
};

export default QuestionsForm;

