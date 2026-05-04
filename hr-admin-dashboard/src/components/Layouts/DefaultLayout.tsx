"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastContainer } from "react-toastify";
import { useRightPanel } from "@/contexts/RightPanelContext";

export type RoleType = "superadmin" | "admin" | "hr" | "interviewer";

interface DefaultLayoutProps {
  children: React.ReactNode;
  role?: RoleType;
  isLoading?: boolean;
  loadingMessage?: string;
}

export default function DefaultLayout({
  children,
  role = "admin",
  isLoading = false,
  loadingMessage = "Loading...",
}: DefaultLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOpen, title, content, closePanel } = useRightPanel();

  return (
    <div className="flex h-screen relative">
      {/* Left Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col lg:ml-72.5 overflow-hidden">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content Wrapper */}
        <div className="flex flex-row h-full relative">
          {/* Main Content */}
          <main
            style={{ paddingBottom: "6rem" }}
            className="flex-1 p-4 md:p-6 2xl:p-10 overflow-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[60vh] w-full">
                <div className="text-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-gray-600">{loadingMessage || "Loading..."}</p>
                </div>
              </div>
            ) : (
              children
            )}
            <ToastContainer position="top-center" autoClose={3000} />
          </main>

          {/* Global Right Slide Panel */}
          {isOpen && (
            <div className="fixed top-16 right-0 w-full max-w-md h-[calc(100vh-64px)] bg-white shadow-lg p-5 z-50 overflow-y-auto border-l border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black dark:text-white">{title}</h2>
                <button
                  onClick={closePanel}
                  className="text-gray-500 hover:text-black text-xl"
                >
                  &times;
                </button>
              </div>
              <div>{content}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
