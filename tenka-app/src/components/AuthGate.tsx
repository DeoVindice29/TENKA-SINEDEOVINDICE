import type { ReactNode } from "react";
import { useAuth } from "@/state/AuthContext";
import LoginScreen from "@/screens/LoginScreen";
import ProfileSetupScreen from "@/screens/ProfileSetupScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session, profile, isGuest } = useAuth();

  if (loading) return <div className="auth-gate-shell" />;
  if (!session && !isGuest) return <LoginScreen />;
  if (!profile?.username) return <ProfileSetupScreen />;

  return <>{children}</>;
}
