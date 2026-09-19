import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LangProvider } from "@/i18n/LangContext";
import { UIProvider } from "@/state/UIContext";
import { QuizProvider } from "@/state/QuizContext";
import { FlashProvider } from "@/state/FlashContext";
import { ConquestProvider } from "@/state/ConquestContext";
import "@/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider>
      <UIProvider>
        <QuizProvider>
          <FlashProvider>
            <ConquestProvider>
              <App />
            </ConquestProvider>
          </FlashProvider>
        </QuizProvider>
      </UIProvider>
    </LangProvider>
  </StrictMode>,
);
