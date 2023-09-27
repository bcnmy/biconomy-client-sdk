// small uid generator, hex: 0-9, a-f (10 chars)
export const generateRandomHex = (): string => {
  const hexChars = "0123456789abcdef";
  let result = "";

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * hexChars.length);
    result += hexChars[randomIndex];
  }

  return result;
};
