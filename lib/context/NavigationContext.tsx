"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Constants
export const BREAKPOINT_MOBILE = 768;
export const BREAKPOINT_TABLET = 1024;
export const SIDEBAR_WIDTH_DESKTOP = 260;
export const DRAWER_WIDTH_MOBILE = 280;

// Types
export type Section =
  | "dashboard"
  | "employees"
  | "projects"
  | "tasks"
  | "ai"
  | "calendar"
  | "reports";

export interface NavigationState {
  isDrawerOpen: boolean;
  isMobile: boolean;
  activeSection: Section;
}

export interface NavigationContextType extends NavigationState {
  toggleDrawer: () => void;
  closeDrawer: () => void;
  setActiveSection: (section: Section) => void;
}

// Internal helpers
function getBreakpoint(): number {
  return window.innerWidth;
}

function isMobile(): boolean {
  return window.innerWidth < BREAKPOINT_MOBILE;
}

function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINT_MOBILE;
}

// Context
const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

// Provider
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINT_MOBILE);
    };

    checkMobile();

    const mediaQuery = window.matchMedia(`(max-width: ${BREAKPOINT_MOBILE}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      // Close drawer and restore scroll when switching to desktop
      if (!e.matches && isDrawerOpen) {
        setIsDrawerOpen(false);
        document.body.style.overflow = "";
        document.body.classList.remove("drawer-open");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      // Cleanup body styles on unmount
      document.body.style.overflow = "";
      document.body.classList.remove("drawer-open");
    };
  }, [isDrawerOpen]);

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => {
      const newState = !prev;
      // Prevent body scroll when drawer is open on mobile
      if (newState && isMobile) {
        document.body.style.overflow = "hidden";
        document.body.classList.add("drawer-open");
      } else {
        document.body.style.overflow = "";
        document.body.classList.remove("drawer-open");
      }
      return newState;
    });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Restore body scroll
    document.body.style.overflow = "";
    document.body.classList.remove("drawer-open");
  };

  const value: NavigationContextType = {
    isDrawerOpen,
    isMobile,
    activeSection,
    toggleDrawer,
    closeDrawer,
    setActiveSection,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook
export function useNavigationContext(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationContext must be used within a NavigationProvider",
    );
  }
  return context;
}
