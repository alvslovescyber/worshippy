import PptxGenJS from "pptxgenjs";
import { getTheme } from "./theme";
import type { SlideContent, GenerateSettings } from "@/lib/types";

// `LAYOUT_WIDE` is 13.333" × 7.5" (16:9 widescreen).
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const BASE_MARGIN = 1.0;

function lyricsFontSize(base: number, linesPerSlide: 2 | 3 | 4): number {
  if (linesPerSlide === 2) return base + 6;
  if (linesPerSlide === 4) return base - 4;
  return base;
}

function sizeDelta(size: GenerateSettings["lyricsTextSize"]): number {
  switch (size) {
    case "sm":
      return -4;
    case "lg":
      return 4;
    case "md":
    default:
      return 0;
  }
}

function lyricsColor(
  themeTextColor: string,
  choice: GenerateSettings["lyricsTextColor"],
) {
  if (choice === "pure") return "FFFFFF";
  if (choice === "soft") return "F3F4F6";
  return themeTextColor;
}

function marginForLyrics(choice: GenerateSettings["lyricsTextMargin"]): number {
  if (choice === "wide") return 1.35;
  return BASE_MARGIN;
}

export async function buildPptx(
  slides: SlideContent[],
  settings: GenerateSettings,
): Promise<Uint8Array<ArrayBuffer>> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";

  const theme = getTheme(settings.theme);
  const fontFace = settings.fontFace ?? theme.fontFace;
  pres.theme = {
    headFontFace: fontFace,
    bodyFontFace: fontFace,
  };

  const titleTextColor = theme.textColor;
  const subtitleColor = theme.subtitleColor;
  const lyricTextColor = lyricsColor(theme.textColor, settings.lyricsTextColor);
  const lyricsMargin = marginForLyrics(settings.lyricsTextMargin);

  for (const sc of slides) {
    const slide = pres.addSlide();

    // Background
    if (sc.type === "lyrics" && settings.backgroundImage) {
      slide.background = { data: settings.backgroundImage };
    } else {
      slide.background = { color: theme.bgColor };
    }

    switch (sc.type) {
      case "cover":
        slide.addText(sc.title ?? "Worship Set", {
          x: BASE_MARGIN,
          y: SLIDE_H * 0.33,
          w: SLIDE_W - BASE_MARGIN * 2,
          h: 1,
          fontSize: theme.titleFontSize,
          fontFace,
          color: titleTextColor,
          align: "center",
          bold: true,
        });
        if (sc.date) {
          slide.addText(sc.date, {
            x: BASE_MARGIN,
            y: SLIDE_H * 0.33 + 1.15,
            w: SLIDE_W - BASE_MARGIN * 2,
            h: 0.5,
            fontSize: theme.subtitleFontSize,
            fontFace,
            color: subtitleColor,
            align: "center",
          });
        }
        slide.addText("Worshippy", {
          x: BASE_MARGIN,
          y: SLIDE_H - BASE_MARGIN - 0.4,
          w: SLIDE_W - BASE_MARGIN * 2,
          h: 0.35,
          fontSize: 12,
          fontFace,
          color: subtitleColor,
          align: "center",
        });
        slide.addText("Developed by Alvis", {
          x: BASE_MARGIN,
          y: SLIDE_H - BASE_MARGIN - 0.15,
          w: SLIDE_W - BASE_MARGIN * 2,
          h: 0.35,
          fontSize: 11,
          fontFace,
          color: subtitleColor,
          align: "center",
        });
        break;

      case "title":
        slide.addText(sc.title ?? "", {
          x: BASE_MARGIN,
          y: SLIDE_H * 0.35,
          w: SLIDE_W - BASE_MARGIN * 2,
          h: 1,
          fontSize: theme.titleFontSize,
          fontFace,
          color: titleTextColor,
          align: "center",
          bold: true,
        });
        if (sc.artist) {
          slide.addText(sc.artist, {
            x: BASE_MARGIN,
            y: SLIDE_H * 0.35 + 1.15,
            w: SLIDE_W - BASE_MARGIN * 2,
            h: 0.5,
            fontSize: theme.subtitleFontSize,
            fontFace,
            color: subtitleColor,
            align: "center",
          });
        }
        slide.addShape("rect" as unknown as PptxGenJS.ShapeType, {
          x: SLIDE_W * 0.42,
          y: SLIDE_H * 0.35 + 2.0,
          w: SLIDE_W * 0.16,
          h: 0.05,
          fill: { color: theme.accentColor, transparency: 15 },
          line: { color: theme.accentColor, transparency: 100 },
        });
        break;

      case "lyrics": {
        const x = lyricsMargin;
        const w = SLIDE_W - lyricsMargin * 2;
        let y = lyricsMargin;

        if (sc.sectionLabel) {
          slide.addText(sc.sectionLabel, {
            x,
            y,
            w,
            h: 0.4,
            fontSize: 14,
            fontFace,
            color: theme.accentColor,
            align: "center",
            italic: true,
            margin: 0,
          });
          y += 0.55;
        }

        const lyricsText = (sc.lines ?? []).join("\n");
        slide.addText(lyricsText, {
          x,
          y,
          w,
          h: SLIDE_H - y - lyricsMargin,
          fontSize:
            lyricsFontSize(theme.lyricsFontSize, settings.linesPerSlide) +
            sizeDelta(settings.lyricsTextSize),
          fontFace,
          color: lyricTextColor,
          align: "center",
          valign: "middle",
          lineSpacingMultiple: 1.3,
          margin: 0,
          shadow: {
            type: "outer",
            color: "000000",
            opacity: 0.45,
            blur: 6,
            offset: 2,
            angle: 90,
          },
        });
        break;
      }
    }
  }

  const output = await pres.write({
    outputType: "arraybuffer" as unknown as "arraybuffer",
  });
  const arrayBuffer = (
    output instanceof ArrayBuffer
      ? output
      : ArrayBuffer.isView(output)
        ? output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength)
        : (output as unknown as ArrayBuffer)
  ) as ArrayBuffer;

  return new Uint8Array(arrayBuffer);
}
