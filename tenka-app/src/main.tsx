import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LangProvider } from "@/i18n/LangContext";
import { UIProvider } from "@/state/UIContext";
import { QuizProvider } from "@/state/QuizContext";
import { FlashProvider } from "@/state/FlashContext";
import { ConquestProvider } from "@/state/ConquestContext";
import { AuthProvider } from "@/state/AuthContext";
import AuthGate from "@/components/AuthGate";
import AdminPanel from "@/admin/AdminPanel";
import "@/styles/index.css";

// /admin-panel sengaja dipisah total dari App biasa (bukan bagian dari
// sistem "screen" di UIContext) — jadi gak ke-mix sama flow belajar/quiz
// user biasa, dan CSS-nya juga terpisah (admin.css, bukan styles.css).
// Catatan deploy: hosting-nya perlu di-setting SPA fallback (semua path
// yang gak ketemu file statis diarahkan ke index.html), atau /admin-panel
// bakal 404 pas di-refresh / dibuka langsung lewat URL.
const isAdminRoute = window.location.pathname.replace(/\/$/, "") === "/admin-panel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminPanel />
    ) : (
      <LangProvider>
        <AuthProvider>
          <AuthGate>
            <UIProvider>
              <QuizProvider>
                <FlashProvider>
                  <ConquestProvider>
                    <App />
                  </ConquestProvider>
                </FlashProvider>
              </QuizProvider>
            </UIProvider>
          </AuthGate>
        </AuthProvider>
      </LangProvider>
    )}
  </StrictMode>,
);
