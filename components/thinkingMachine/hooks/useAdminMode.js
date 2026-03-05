import { useCallback, useEffect, useRef, useState } from "react";

export function useAdminMode({
  storageKey = "vtm-admin-mode-enabled",
  hintDismissedKey = "vtm-admin-shortcut-hint-dismissed",
} = {}) {
  // Important: avoid reading from window/storage during render,
  // otherwise SSR markup can differ from the first client render (hydration mismatch).
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminShortcutHint, setShowAdminShortcutHint] = useState(false);
  const hasLoadedFromStorageRef = useRef(false);

  useEffect(() => {
    let enabled = false;
    let hintDismissed = false;

    try {
      enabled = window.localStorage.getItem(storageKey) === "1";
    } catch {
      enabled = false;
    }

    try {
      hintDismissed = window.sessionStorage.getItem(hintDismissedKey) === "1";
    } catch {
      hintDismissed = false;
    }

    setIsAdminMode(enabled);
    setShowAdminShortcutHint(!hintDismissed);
    hasLoadedFromStorageRef.current = true;
  }, [storageKey, hintDismissedKey]);

  const dismissAdminShortcutHint = useCallback(() => {
    setShowAdminShortcutHint(false);
    try {
      window.sessionStorage.setItem(hintDismissedKey, "1");
    } catch {
      // ignore storage write errors
    }
  }, [hintDismissedKey]);

  useEffect(() => {
    if (!hasLoadedFromStorageRef.current) return;
    try {
      window.localStorage.setItem(storageKey, isAdminMode ? "1" : "0");
    } catch {
      // ignore storage write errors
    }
  }, [isAdminMode, storageKey]);

  useEffect(() => {
    const handleKeydown = (event) => {
      const isAdminToggle =
        (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "a";
      if (!isAdminToggle) return;

      event.preventDefault();
      setIsAdminMode((prev) => !prev);
      dismissAdminShortcutHint();
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [dismissAdminShortcutHint]);

  return {
    isAdminMode,
    showAdminShortcutHint,
    dismissAdminShortcutHint,
  };
}

