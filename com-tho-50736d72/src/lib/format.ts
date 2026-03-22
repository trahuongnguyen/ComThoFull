/**
 * Format a number to currency format with thousand separators
 * @param amount - The number to format
 * @param suffix - Optional suffix (default: 'đ')
 * @returns Formatted currency string (e.g., "1,000,000đ")
 */
export function formatCurrency(amount: number, suffix: string = 'đ'): string {
  return amount.toLocaleString('vi-VN') + suffix;
}

/**
 * Format a number to currency format with VND suffix
 * @param amount - The number to format
 * @returns Formatted currency string (e.g., "1,000,000 VND")
 */
export function formatCurrencyVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}
