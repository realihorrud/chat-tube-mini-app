import { useLaunchParams, useSignal, miniApp } from "@tma.js/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { ChatProvider } from "@/store/ConversationContext.tsx";
import { ConversationLayout } from "@/components/ConversationLayout/ConversationLayout.tsx";
import { CoversationPage } from "@/pages/ConversationPage/CoversationPage.tsx";
import { WelcomeScreen } from "@/components/WelcomeScreen/WelcomeScreen";
import { swipeBehavior } from "@tma.js/sdk-react";

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
        <ChatProvider>
          <ConversationLayout>
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/chat/:id" element={<CoversationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ConversationLayout>
        </ChatProvider>
      </HashRouter>
    </AppRoot>
  );
}
