/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Optional; intended for local `.env` only — prefills the API key field in the UI. */
  readonly VITE_PREFILL_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
