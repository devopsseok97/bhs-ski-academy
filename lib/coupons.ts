export function couponBalance(events: { delta: number }[]): number {
  return events.reduce((sum, e) => sum + e.delta, 0);
}
