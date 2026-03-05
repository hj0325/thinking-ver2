import { useState } from "react";

export function useLegacyChatFallback(queryKey = "legacyChat") {
  const [enabled] = useState(() => {
    try {
      const query = new URLSearchParams(window.location.search);
      return query.get(queryKey) === "1";
    } catch {
      return false;
    }
  });

  return enabled;
}

