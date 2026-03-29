import { createContext, useContext, useState, useEffect } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "worker";
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fixit_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("fixit_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem("fixit_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fixit_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
