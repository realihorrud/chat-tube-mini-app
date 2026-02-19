import { useLaunchParams, useSignal, miniApp } from '@tma.js/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { ChatProvider } from '@/store/ChatContext';
import { ChatLayout } from '@/components/ChatLayout/ChatLayout';
import {swipeBehavior} from "@tma.js/sdk-react";

export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  swipeBehavior.mount();

  if (swipeBehavior.isSupported() && swipeBehavior.isMounted()) {
    swipeBehavior.disableVertical();
  }

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <ChatProvider>
        <ChatLayout />
      </ChatProvider>
    </AppRoot>
  );
}
