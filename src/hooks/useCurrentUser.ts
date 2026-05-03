import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null; // ✅ evita json() em vazio
        return res.json();
      })
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
