import type { ReactNode } from "react";
import { useAuth } from "@/state/AuthContext";
import LoginScreen from "@/screens/LoginScreen";
import ProfileSetupScreen from "@/screens/ProfileSetupScreen";
import { FullScreenLoader } from "@/components/ui/Loader";
import { useLang } from "@/i18n/LangContext";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session, profile, isGuest } = useAuth();
  const { t } = useLang();

  if (loading) return <FullScreenLoader label={t("loading.auth")} />;
  if (!session && !isGuest) return <LoginScreen />;
  if (!profile?.username) return <ProfileSetupScreen />;

  return <>{children}</>;
}
