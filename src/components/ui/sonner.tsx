
// This file is now empty as toast functionality is removed
export function Toaster() {
  return null;
}

export const toast = {
  // Provide empty methods to prevent errors in case they're still called somewhere
  error: () => {},
  success: () => {},
  info: () => {},
  warning: () => {},
};
