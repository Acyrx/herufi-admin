"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";

// Define the interface for the context state
interface SidebarContextProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>; // Add setIsOpen to the interface
}

// Create the context with a default value
const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

// Provider component
export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook for easier access to the context
export const useSidebar = (): SidebarContextProps => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
