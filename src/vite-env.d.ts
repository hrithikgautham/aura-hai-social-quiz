
/// <reference types="vite/client" />

declare interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (callback: (notification: any) => void) => void;
        renderButton: (element: HTMLElement, options: any) => void;
      };
    };
  };
}
 