/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
}

declare module 'pdfjs-dist' {
  export function getDocument(options: { data: ArrayBuffer }): { promise: Promise<any> }
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}