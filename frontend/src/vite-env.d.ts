/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_PROCESSOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
