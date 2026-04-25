import bcrypt from "bcryptjs";

export const MIN_PIN_LENGTH = 6;

const PIN_PATTERN = /^\d{6}$/;

export function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  if (pin.length !== MIN_PIN_LENGTH) {
    return {
      valid: false,
      error: "O PIN deve ter exatamente 6 dígitos.",
    };
  }

  if (!PIN_PATTERN.test(pin)) {
    return {
      valid: false,
      error: "O PIN deve conter apenas números.",
    };
  }

  return { valid: true };
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
