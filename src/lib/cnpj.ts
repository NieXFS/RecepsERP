export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string) {
  const digits = normalizeCnpj(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value);

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calculateDigit = (base: string, factor: number) => {
    let total = 0;

    for (const digit of base) {
      total += Number(digit) * factor;
      factor = factor === 2 ? 9 : factor - 1;
    }

    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), 5);
  const secondDigit = calculateDigit(`${cnpj.slice(0, 12)}${firstDigit}`, 6);

  return cnpj === `${cnpj.slice(0, 12)}${firstDigit}${secondDigit}`;
}
