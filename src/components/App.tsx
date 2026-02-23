import { useLaunchParams, useSignal, miniApp } from "@tma.js/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { ChatProvider } from "@/store/ConversationContext.tsx";
import { ConversationLayout } from "@/components/ConversationLayout/ConversationLayout.tsx";
import { ConversationPage } from "@/pages/ConversationPage/ConversationPage.tsx";
import { SharedConversationPage } from "@/pages/SharedConversationPage/SharedConversationPage.tsx";
import { WelcomeScreen } from "@/components/WelcomeScreen/WelcomeScreen";
import { swipeBehavior } from "@tma.js/sdk-react";

function StartParamRouter() {
  const lp = useLaunchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const startParam = lp.tgWebAppStartParam;
    if (!startParam) return;

    // startapp format: "c_{uuid}_{signature}"
    // UUID contains hyphens, so we match the first "c_" prefix, then UUID, then the rest is signature
    const match = startParam.match(/^c_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(.+)$/i);
    if (match) {
      const [, id, signature] = match;
      navigate(`/c/${id}/shared?signature=${encodeURIComponent(signature)}`, { replace: true });
    }
  }, [lp.tgWebAppStartParam, navigate]);

  return null;
}

export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  swipeBehavior.mount();

  if (swipeBehavior.isSupported() && swipeBehavior.isMounted()) {
    swipeBehavior.disableVertical();
  }

  return (
    <AppRoot
      appearance={isDark ? "dark" : "light"}
      platform={["macos", "ios"].includes(lp.tgWebAppPlatform) ? "ios" : "base"}
    >
      <HashRouter>
        <StartParamRouter />
        <ChatProvider>
          <ConversationLayout>
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/c/:id" element={<ConversationPage />} />
              <Route
                path="/c/:id/shared"
                element={<SharedConversationPage />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ConversationLayout>
        </ChatProvider>
      </HashRouter>
    </AppRoot>
  );
}
