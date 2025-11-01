/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_BUILD_TIMESTAMP: string;
  // Adicione outras variáveis de ambiente aqui, se houver
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}