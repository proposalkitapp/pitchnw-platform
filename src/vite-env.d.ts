/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DODO_PRO_PRODUCT_ID?: string;
  readonly VITE_DODO_STANDARD_PRODUCT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
