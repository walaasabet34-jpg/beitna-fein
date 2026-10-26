const DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n: number | string) => String(n).replace(/[0-9]/g, (d) => DIGITS[+d]);
export const piasters = (n: number) => `${arNum(n)} قرش`;

/** What an action costs, shown before the player commits: time (a period of the day) and money. */
export function costBadge(e?: { slots?: number; money?: number }): string | undefined {
  if (!e) return undefined;
  const parts: string[] = [];
  if (e.slots) parts.push('⏳ فترة');
  if (e.money && e.money < 0) parts.push(`${arNum(-e.money)} قرش`);
  if (e.money && e.money > 0) parts.push(`+${arNum(e.money)} قرش`);
  return parts.length ? parts.join(' · ') : undefined;
}
