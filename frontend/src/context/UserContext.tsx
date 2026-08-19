import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import supabase from "../lib/supabase";
import { api } from "../lib/api";

export type AppUser = {
  id: string;
  name: string;
  email: string;
};

type UserContextValue = {
  user: AppUser | null;
  isLoaded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateName: (name: string) => void;
};

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Build an AppUser from Supabase Auth + backend profile.
   * Fetches the profile from the backend to get the user's name.
   */
  const buildAppUser = useCallback(
    async (
      authUser: { id: string; email: string | undefined },
    ): Promise<AppUser> => {
      const base = {
        id: authUser.id,
        email: authUser.email ?? "",
      };

      // Try to fetch profile from backend for the name
      try {
        const profile = await api.getProfile(authUser.id);
        return { ...base, name: profile.name ?? authUser.email?.split("@")[0] ?? "User" };
      } catch {
        // No profile yet — use email-based name as fallback
        return {
          ...base,
          name: authUser.email?.split("@")[0] ?? "User",
        };
      }
    },
    [],
  );

  // ── Initial session check + subscribe to auth changes ──
  useEffect(() => {
    // On mount, check for existing session via getSession (handles page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        buildAppUser(session.user).then(setUser);
      }
      setIsLoaded(true);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    // Skip INITIAL_SESSION since getSession above already handles it
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;

      if (session?.user) {
        const appUser = await buildAppUser(session.user);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoaded(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [buildAppUser]);

  // ── Sign In ──
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // buildAppUser will be called by onAuthStateChange automatically
  }, []);

  // ── Sign Up ──
  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      if (!name || !email || !password) {
        throw new Error("Please fill in all sign-up fields.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Sign-up failed. Please try again.");
      }

      // Create a profile in the backend with the user's name
      try {
        await api.createProfile({
          user_id: data.user.id,
          name,
          email: data.user.email ?? null,
        });
      } catch (profileErr) {
        // Profile creation failure is non-fatal — the user can set their name later
        console.warn("Profile creation warning:", profileErr);
      }

      // buildAppUser will be called by onAuthStateChange automatically
    },
    [],
  );

  // ── Sign Out ──
  const signOut = useCallback(() => {
    // Fire-and-forget: Supabase handles session cleanup
    // onAuthStateChange will fire and set user to null
    supabase.auth.signOut().catch((err) => {
      console.error("Sign out error:", err);
    });
  }, []);

  // ── Update Name ──
  const updateName = useCallback(
    (name: string) => {
      if (!user) return;
      setUser((prev) => (prev ? { ...prev, name } : null));
    },
    [user],
  );

  return (
    <UserContext.Provider
      value={{ user, isLoaded, signIn, signUp, signOut, updateName }}
    >
      {children}
    </UserContext.Provider>
  );
}
