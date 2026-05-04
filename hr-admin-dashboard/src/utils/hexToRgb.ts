export default function hexToRgb(hex: string): string | null {
    const sanitizedHex = hex.replace("#", "");
    if (sanitizedHex.length !== 6) return null;
  
    const r = parseInt(sanitizedHex.slice(0, 2), 16);
    const g = parseInt(sanitizedHex.slice(2, 4), 16);
    const b = parseInt(sanitizedHex.slice(4, 6), 16);
  
    return `${r} ${g} ${b}`;
  }
  