import PptxGenJS from "pptxgenjs";
import { getTheme } from "./theme";
import type { SlideContent, GenerateSettings } from "@/lib/types";

const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.5;

export async function buildPptx(
  slides: SlideContent[],
  settings: GenerateSettings,
): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";

  const theme = getTheme(settings.theme);

  for (const sc of slides) {
    const slide = pres.addSlide();

    // Background
    if (sc.type === "lyrics" && settings.backgroundImage) {
      slide.background = { data: settings.backgroundImage };
    } else {
      slide.background = { color: theme.bgColor };
    }

    // Translucent overlay for readability
    if (sc.type === "lyrics") {
      slide.addShape("rect" as unknown as PptxGenJS.ShapeType, {
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: SLIDE_H,
        fill: {
          color: theme.overlayColor,
          transparency: Math.round((1 - theme.overlayOpacity) * 100),
        },
      });
    }

    switch (sc.type) {
      case "cover":
        slide.addText(sc.title ?? "Worship Set", {
          x: MARGIN,
          y: SLIDE_H * 0.3,
          w: SLIDE_W - MARGIN * 2,
          h: 1,
          fontSize: theme.titleFontSize,
          fontFace: theme.fontFace,
          color: theme.textColor,
          align: "center",
          bold: true,
        });
        if (sc.date) {
          slide.addText(sc.date, {
            x: MARGIN,
            y: SLIDE_H * 0.3 + 1.1,
            w: SLIDE_W - MARGIN * 2,
            h: 0.5,
            fontSize: theme.subtitleFontSize,
            fontFace: theme.fontFace,
            color: theme.subtitleColor,
            align: "center",
          });
        }
        break;

      case "title":
        slide.addText(sc.title ?? "", {
          x: MARGIN,
          y: SLIDE_H * 0.32,
          w: SLIDE_W - MARGIN * 2,
          h: 1,
          fontSize: theme.titleFontSize,
          fontFace: theme.fontFace,
          color: theme.textColor,
          align: "center",
          bold: true,
        });
        if (sc.artist) {
          slide.addText(sc.artist, {
            x: MARGIN,
            y: SLIDE_H * 0.32 + 1.1,
            w: SLIDE_W - MARGIN * 2,
            h: 0.5,
            fontSize: theme.subtitleFontSize,
            fontFace: theme.fontFace,
            color: theme.subtitleColor,
            align: "center",
          });
        }
        break;

      case "lyrics": {
        let yOffset = MARGIN;

        if (sc.sectionLabel) {
          slide.addText(sc.sectionLabel, {
            x: MARGIN,
            y: yOffset,
            w: SLIDE_W - MARGIN * 2,
            h: 0.4,
            fontSize: 14,
            fontFace: theme.fontFace,
            color: theme.accentColor,
            align: "center",
            italic: true,
          });
          yOffset += 0.5;
        }

        const lyricsText = (sc.lines ?? []).join("\n");
        slide.addText(lyricsText, {
          x: MARGIN,
          y: yOffset,
          w: SLIDE_W - MARGIN * 2,
          h: SLIDE_H - yOffset - MARGIN,
          fontSize: theme.lyricsFontSize,
          fontFace: theme.fontFace,
          color: theme.textColor,
          align: "center",
          valign: "middle",
          lineSpacingMultiple: 1.3,
        });
        break;
      }
    }
  }

  const output = await pres.write({ outputType: "nodebuffer" });
  return output as Buffer;
}
