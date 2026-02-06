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
  bgColor: "0A0A0F",
  bgGradient: { color1: "0A0A0F", color2: "111827" },
  textColor: "FFFFFF",
  subtitleColor: "A0A0B8",
  accentColor: "F97316",
  fontFace: "Calibri",
  titleFontSize: 44,
  lyricsFontSize: 36,
  subtitleFontSize: 20,
  overlayColor: "000000",
  overlayOpacity: 0.38,
};

export const lightTheme: PptxTheme = {
  bgColor: "F8FAFC",
  bgGradient: { color1: "FFFFFF", color2: "EEF2FF" },
  textColor: "1A1A2E",
  subtitleColor: "6B7280",
  accentColor: "F97316",
  fontFace: "Calibri",
  titleFontSize: 44,
  lyricsFontSize: 36,
  subtitleFontSize: 20,
  overlayColor: "FFFFFF",
  overlayOpacity: 0.55,
};

export function getTheme(name: "dark" | "light"): PptxTheme {
  return name === "dark" ? darkTheme : lightTheme;
}
