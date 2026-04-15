function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatBrazilPhone(value: string) {
  let digits = digitsOnly(value);

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidBrazilPhone(value: string) {
  const digits = digitsOnly(value);

  if (digits.startsWith("55")) {
    return digits.length === 12 || digits.length === 13;
  }

  return digits.length === 10 || digits.length === 11;
}

export function normalizeBrazilPhone(value: string) {
  const digits = digitsOnly(value);

  if (!digits) {
    throw new Error("Informe um telefone válido.");
  }

  if (digits.startsWith("55")) {
    if (digits.length !== 12 && digits.length !== 13) {
      throw new Error("Informe um telefone brasileiro válido.");
    }

    return `+${digits}`;
  }

  if (digits.length !== 10 && digits.length !== 11) {
    throw new Error("Informe um telefone brasileiro válido.");
  }

  return `+55${digits}`;
}
