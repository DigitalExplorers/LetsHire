"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PanelState {
  isOpen: boolean;
  title?: string;
  content?: ReactNode;
}

interface RightPanelContextType extends PanelState {
  openPanel: (title: string, content: ReactNode) => void;
  closePanel: () => void;
}

const RightPanelContext = createContext<RightPanelContextType>({
  isOpen: false,
  openPanel: () => {},
  closePanel: () => {},
});

export const useRightPanel = () => useContext(RightPanelContext);

export const RightPanelProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PanelState>({
    isOpen: false,
    title: "",
    content: null,
  });

  const openPanel = (title: string, content: ReactNode) =>
    setState({ isOpen: true, title, content });

  const closePanel = () =>
    setState((prev) => ({ ...prev, isOpen: false, content: null }));

  return (
    <RightPanelContext.Provider value={{ ...state, openPanel, closePanel }}>
      {children}
    </RightPanelContext.Provider>
  );
};
