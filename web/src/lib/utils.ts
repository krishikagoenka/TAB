export function shortenAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: bigint): string {
  const isNegative = wei < 0n;
  const absWei = isNegative ? -wei : wei;
  const str = absWei.toString().padStart(19, '0');
  const integerPart = str.slice(0, -18) || '0';
  const fractionPart = str.slice(-18).slice(0, 4);
  return `${isNegative ? '-' : ''}${integerPart}.${fractionPart}`;
}

export function parseEther(ether: string): bigint {
  if (!ether || isNaN(Number(ether))) return 0n;
  const [intPart, fracPart = ''] = ether.split('.');
  const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
  const sign = intPart.startsWith('-') ? -1n : 1n;
  const cleanInt = intPart.replace('-', '') || '0';
  const full = `${cleanInt}${paddedFrac}`;
  return sign * BigInt(full);
}

export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  // Handles both seconds and milliseconds Unix timestamps
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDisplayName(address: string): string {
  return shortenAddress(address);
}
