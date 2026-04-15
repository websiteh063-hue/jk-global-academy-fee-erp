import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("school_fee_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("school_fee_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.data);
        localStorage.setItem("school_fee_user", JSON.stringify(response.data.data));
      } catch (_error) {
        localStorage.removeItem("school_fee_token");
        localStorage.removeItem("school_fee_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const { token, user: loggedInUser } = response.data.data;

    localStorage.setItem("school_fee_token", token);
    localStorage.setItem("school_fee_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("school_fee_token");
    localStorage.removeItem("school_fee_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
