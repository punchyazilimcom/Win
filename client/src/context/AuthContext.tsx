import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import { ensureUserDoc, getSettings } from "../lib/firestore";
import type { AppSettings, Role } from "../lib/types";

interface AuthState {
  user: User | null;
  role: Role;
  displayName: string;
  settings: AppSettings;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const FALLBACK_SETTINGS: AppSettings = {
  appName: "Excel Yöneticisi",
  brandColor: "#F4DF16",
  logoUrl: "",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("viewer");
  const [displayName, setDisplayName] = useState<string>("");
  const [settings, setSettings] = useState<AppSettings>(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    // Load global branding once (independent of auth).
    refreshSettings().catch(() => undefined);
  }, [refreshSettings]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const udoc = await ensureUserDoc(
            u.uid,
            u.email,
            u.displayName || (u.email ? u.email.split("@")[0] : "Kullanıcı")
          );
          setRole(udoc.role);
          setDisplayName(udoc.displayName);
        } catch {
          setRole("viewer");
          setDisplayName(u.email || "Kullanıcı");
        }
      } else {
        setRole("viewer");
        setDisplayName("");
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value: AuthState = {
    user,
    role,
    displayName,
    settings,
    loading,
    isAdmin: role === "admin",
    login,
    logout,
    refreshSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
