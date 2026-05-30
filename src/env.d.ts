/// <reference types="astro/client" />

interface Stonks {
  event(name: string): void;
  event(name: string, path: string): void;
  event(name: string, props: Record<string, unknown>): void;
  event(name: string, path: string, props: Record<string, unknown>): void;
}

interface Window {
  stonks?: Stonks;
}
