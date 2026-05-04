"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownActionsProps {
  trigger: (props: { onClick: (e: React.MouseEvent) => void; ref: React.RefObject<any> }) => React.ReactNode;
  items: (props: { close: () => void }) => React.ReactNode;
}

const DropdownActions: React.FC<DropdownActionsProps> = ({ trigger, items }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isAbove, setIsAbove] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownHeight = 240; // estimated height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const shouldOpenAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    const top = shouldOpenAbove ? rect.top - dropdownHeight : rect.bottom + 8;
    setIsAbove(shouldOpenAbove);
    setPosition({ top, left: rect.left });
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setPosition(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <>
      {trigger({ onClick: handleToggle, ref: triggerRef })}

      {position &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed z-[9999] bg-white shadow-md border rounded-md w-40 max-h-60 overflow-y-auto ${
              isAbove ? "origin-bottom" : "origin-top"
            }`}
            style={{ top: position.top, left: position.left }}
          >
            {items({ close: () => setPosition(null) })}
          </div>,
          document.body
        )}
    </>
  );
};

export default DropdownActions;