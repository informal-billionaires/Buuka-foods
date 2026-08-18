export function computeCustomerPrice(basePrice: number, marginPercentage: number): number {
  const raw = basePrice * (1 + marginPercentage / 100);
  // round UP to nearest 100 naira
  return Math.ceil(raw / 100) * 100;
}