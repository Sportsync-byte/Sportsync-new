/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DASHBOARD_URL?: string;
  readonly VITE_WEBSITE_URL?: string;
  readonly VITE_SCOREBOARD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
