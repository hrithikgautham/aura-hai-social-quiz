
export function generateSequentialLink(): string {
  const generateChar = (n: number): string => {
    if (n < 26) {
      return String.fromCharCode(97 + n); // 97 is 'a' in ASCII
    }
    const first = Math.floor(n / 26) - 1;
    const second = n % 26;
    return generateChar(first) + String.fromCharCode(97 + second);
  };

  // Get current timestamp to ensure uniqueness
  const timestamp = Date.now();
  const base = Math.floor(timestamp % 1000); // Use last 3 digits of timestamp
  return generateChar(base);
}
