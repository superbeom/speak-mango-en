declare global {
  interface Window {
    gtag?: GTagFunction;
    dataLayer?: DataLayer[];
  }
}

export type DataLayer = Record<string, unknown> | Array<unknown> | IArguments;

export interface GTagFunction {
  (command: "js", date: Date): void;
  (command: "config", targetId: string, config?: Record<string, unknown>): void;
  (command: "event", eventName: string, params?: Record<string, unknown>): void;
}
