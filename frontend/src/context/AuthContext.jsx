import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { clearSession, getStoredUser, getToken, setSession } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [initializing, setInitializing] = useState(!!getToken());

  useEffect(() => {
    // On refresh, if we have a token, re-validate it against the backend
    // and refresh the cached user profile.
    let cancelled = false;
    if (getToken()) {
      authApi
        .me()
        .then((freshUser) => {
          if (!cancelled) {
            setUser(freshUser);
            setSession(getToken(), freshUser);
          }
        })
        .catch(() => {
          if (!cancelled) {
            clearSession();
            setUser(null);
          }
        })
        .finally(() => {
          if (!cancelled) setInitializing(false);
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await authApi.login({ email, password });
    setSession(token, loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const isResearcher = !!user?.roles?.includes("RESEARCHER");

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, initializing, isResearcher }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
