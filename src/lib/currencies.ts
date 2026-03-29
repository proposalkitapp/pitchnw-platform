export interface Currency {
  code: string;
  label: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "₵" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "EGP", label: "Egyptian Pound", symbol: "E£" },
  { code: "TZS", label: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", label: "Ugandan Shilling", symbol: "USh" },
];

export function getCurrencyByCode(code: string): Currency {
  return currencies.find((c) => c.code === code) || currencies[0];
}

export function formatBudget(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    const c = getCurrencyByCode(currencyCode);
    return `${c.symbol}${amount.toLocaleString()}`;
  }
}
