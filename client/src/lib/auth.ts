import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiRequest } from "./queryClient";

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  isEditor: boolean;
  isGestor: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const response = await apiRequest("POST", "/api/auth/login", {
          email,
          password,
        });
        const data = await response.json();
        
        set({
          user: data.user,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
