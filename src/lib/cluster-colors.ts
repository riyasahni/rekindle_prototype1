/** Deterministic saturated colors for cluster indices (good contrast on phone screens). */
export function clusterIndexToCss(k: number, index: number): string {
  if (k <= 0) return "hsl(0 0% 50%)";
  const hue = Math.round((360 / k) * (index % k));
  return `hsl(${hue} 72% 46%)`;
}

function hslToHex(h: number, s: number, l: number): string {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function clusterIndexToHex(k: number, index: number): string {
  if (k <= 0) return "#888888";
  const hue = Math.round((360 / k) * (index % k));
  return hslToHex(hue, 72, 46);
}
