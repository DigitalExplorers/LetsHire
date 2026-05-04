"use client";

import { useRightPanel } from "@/contexts/RightPanelContext";
import { X } from "lucide-react";
import { useEffect } from "react";

const RightPanel = () => {
  const { isOpen, title, content, closePanel } = useRightPanel();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closePanel();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, closePanel]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 w-full sm:w-[480px] h-[calc(100vh-64px)] z-[9999] bg-white shadow-lg border-l border-gray-200 overflow-y-auto transition-transform animate-slide-in">
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button onClick={closePanel} className="text-gray-500 hover:text-gray-800">
          <X size={20} />
        </button>
      </div>
      <div className="p-5">{content}</div>
    </div>
  );
};

export default RightPanel;
