/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_DODO_PRO_PRODUCT_ID?: string;
  readonly NEXT_PUBLIC_DODO_STANDARD_PRODUCT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
