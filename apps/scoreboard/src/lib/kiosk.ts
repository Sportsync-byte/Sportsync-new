export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

export async function enterKioskMode(): Promise<boolean> {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    const legacy = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (legacy.webkitRequestFullscreen) {
      await legacy.webkitRequestFullscreen();
      return true;
    }
  } catch {
  }
  return false;
}

export function isFullscreen(): boolean {
  return Boolean(document.fullscreenElement);
}
