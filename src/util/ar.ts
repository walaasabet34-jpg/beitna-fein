const DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n: number | string) => String(n).replace(/[0-9]/g, (d) => DIGITS[+d]);
export const piasters = (n: number) => `${arNum(n)} قرش`;
