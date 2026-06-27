import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  clearLocalUser,
  createLocalUser,
  getLocalUser,
  signInLocalUser,
  updateLocalUser,
  type LocalUser,
} from "../lib/user";

type UserContextValue = {
  user: LocalUser | null;
  isLoaded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateName: (name: string) => void;
};

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getLocalUser());
    setIsLoaded(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const signedIn = signInLocalUser(email, password);
    if (!signedIn) {
      throw new Error("Invalid email or password.");
    }
    setUser(signedIn);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      if (!name || !email || !password) {
        throw new Error("Please fill in all sign-up fields.");
      }
      const user = createLocalUser(name, email, password);
      setUser(user);
    },
    [],
  );

  const updateName = useCallback((name: string) => {
    if (!user) return;
    const updated = updateLocalUser(name, user.email);
    setUser(updated);
  }, [user]);

  const signOut = useCallback(() => {
    clearLocalUser();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoaded, signIn, signUp, signOut, updateName }}>
      {children}
    </UserContext.Provider>
  );
}
