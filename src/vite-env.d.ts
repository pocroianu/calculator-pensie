/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_ENABLED: string;
  readonly VITE_ANALYTICS_DOMAIN: string;
  readonly VITE_ANALYTICS_SCRIPT_SRC: string;
  readonly VITE_ANALYTICS_API_HOST: string;
  readonly VITE_ANALYTICS_TRACK_LOCALHOST: string;
  readonly VITE_ANALYTICS_HASH_MODE: string;
  readonly VITE_ENABLE_SW: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
