export interface PptxTheme {
  bgColor: string;
  bgGradient: { color1: string; color2: string };
  textColor: string;
  subtitleColor: string;
  accentColor: string;
  fontFace: string;
  titleFontSize: number;
  lyricsFontSize: number;
  subtitleFontSize: number;
  overlayColor: string;
  overlayOpacity: number;
}

export const darkTheme: PptxTheme = {
  bgColor: "1a1a2e",
  bgGradient: { color1: "1a1a2e", color2: "16213e" },
  textColor: "FFFFFF",
  subtitleColor: "A0A0B8",
  accentColor: "F97316",
  fontFace: "Arial",
  titleFontSize: 44,
  lyricsFontSize: 36,
  subtitleFontSize: 20,
  overlayColor: "000000",
  overlayOpacity: 0.45,
};

export const lightTheme: PptxTheme = {
  bgColor: "F8F9FA",
  bgGradient: { color1: "FFFFFF", color2: "E8E8F0" },
  textColor: "1A1A2E",
  subtitleColor: "6B7280",
  accentColor: "F97316",
  fontFace: "Arial",
  titleFontSize: 44,
  lyricsFontSize: 36,
  subtitleFontSize: 20,
  overlayColor: "FFFFFF",
  overlayOpacity: 0.55,
};

export function getTheme(name: "dark" | "light"): PptxTheme {
  return name === "dark" ? darkTheme : lightTheme;
}
