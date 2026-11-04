// Every font the app renders, self-hosted (SIL OFL, licences in ./fonts). next/font/local inlines
// them at build time, so `next build` makes no network request. These used to come from
// next/font/google, which fetches fonts.googleapis.com during the build; Google intermittently serves
// GitHub runners and Railway's builders broken CSS and the build dies in the loader ("Cannot read
// properties of null (reading '1')"). Same pattern as analytics #186.
//
// Plus Jakarta Sans is the exact woff2 files Google Fonts served for the old config
// (byte-identical, sha256, to what next/font/google shipped), with the same faces: one @font-face per
// weight and per unicode-range subset, display swap, and only the latin subset preloaded. The weights
// stay discrete (400/500/600/700) even though the files are variable, so any weight the CSS asks for in
// between keeps snapping to a declared face, exactly as before. A single "400 700" range would render
// it at its literal weight and change the look.
//
// next/font/local gives one family per call and cannot vary unicode-range inside a call, so each
// subset is its own call and the --font-sans stack is assembled below, in the order
// Google's segmented family resolved them (its CSS lists latin last, and the last-defined face wins
// an overlapping range). Each stack ends in a metric-adjusted Arial face (fonts/fallback.css) with
// the exact values next/font/google generated. It is not only the pre-load placeholder: it also draws
// every glyph the font lacks (Greek and basic Cyrillic in Plus Jakarta Sans), and next/font/local's own fallback, computed from the file,
// comes out ~1% wider and shifts that text.
import type { CSSProperties } from "react";
import localFont from "next/font/local";
import "./fonts/fallback.css";

const sansLatin = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
  adjustFontFallback: false,
});

const sansLatinExt = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-latin-ext.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin-ext.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin-ext.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin-ext.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
  preload: false,
  adjustFontFallback: false,
});

const sansVietnamese = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-vietnamese.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-vietnamese.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-vietnamese.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-vietnamese.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" }],
  preload: false,
  adjustFontFallback: false,
});

const sansCyrillicExt = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-cyrillic-ext.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-cyrillic-ext.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-cyrillic-ext.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-cyrillic-ext.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" }],
  preload: false,
  adjustFontFallback: false,
});

type LoadedFont = { style: { fontFamily: string } };

/** Each subset's family in priority order, then the metric-adjusted fallback family. */
export function fontStack(subsets: LoadedFont[], fallback: string): string {
  return [...subsets.map((f) => f.style.fontFamily.split(",")[0].trim()), `'${fallback}'`].join(", ");
}

/** Goes on <html style>: the variable next/font/google used to set through a class. */
export const fontVariables = {
  "--font-sans": fontStack([sansLatin, sansLatinExt, sansVietnamese, sansCyrillicExt], "__sans_Fallback"),
} as CSSProperties;
