/**
 * Self-hosted fonts (see app/fonts.ts). The build must not reach out to Google Fonts: it
 * intermittently serves GitHub runners and Railway's builders broken CSS and `next build` dies in
 * next/font/google ("Cannot read properties of null (reading '1')"). And the look must not change:
 * the woff2 files are the bytes next/font/google shipped, each subset keeps Google's unicode-range and
 * the old weights, the stacks resolve the subsets in the order Google's segmented family did, and they
 * end in Arial faces with next/font/google's exact metrics.
 *
 * Static checks only: next/font/local is a compile-time transform and throws outside `next build`.
 *
 *   npm test   (node --test tests/)
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "app");
const FONTS = path.join(APP, "fonts");
const fontsTs = fs.readFileSync(path.join(APP, "fonts.ts"), "utf8");

// sha256 of the files next/font/google emitted into .next/static/media for the old config.
const SHA256 = {
  "plus-jakarta-sans-latin.woff2": "cd8db90cd950e26bc8761f65d323588bd5cd112d326d6d322bc7c8ea86771215",
  "plus-jakarta-sans-latin-ext.woff2": "0303e02b53b0298fb26a0193941a2e8754f0f9a9fce50d90b178d8da3424873f",
  "plus-jakarta-sans-vietnamese.woff2": "5c913fc1b1f86f4b475e5df45a796aa480d1f7f0891ed6f1a5991d6d1be887c3",
  "plus-jakarta-sans-cyrillic-ext.woff2": "a16f29d7d2a21a4f9b3249a82eb2725ed5bdb91500dfb5c4758977de27477f20",
};

// Google Fonts' unicode-range per subset (CSS2 API), as next/font/google declared them.
const RANGES = {
  latin: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  "latin-ext": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
  vietnamese: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
  greek: "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF",
  cyrillic: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
  "cyrillic-ext": "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
};

// family var -> file prefix, weights, subsets in Google's resolution order, fallback metrics
const STACKS = {
  "--font-sans": {
    file: "plus-jakarta-sans",
    weights: ["400", "500", "600", "700"],
    subsets: ["latin", "latin-ext", "vietnamese", "cyrillic-ext"],
    fallback: ["98.88%", "21.15%", "0.00%", "104.98%"],
  },
};

/** const name -> { files, weights, unicode-range, preload } for every localFont call in fonts.ts. */
function calls() {
  const out = new Map();
  for (const m of fontsTs.matchAll(/const (\w+) = localFont\(\{([\s\S]*?)\n\}\);/g)) {
    const body = m[2];
    out.set(m[1], {
      files: [...body.matchAll(/path: "\.\/fonts\/([^"]+)"/g)].map((x) => x[1]),
      weights: [...body.matchAll(/weight: "([^"]+)"/g)].map((x) => x[1]),
      range: body.match(/prop: "unicode-range", value: "([^"]+)"/)?.[1],
      preload: !/preload: false/.test(body),
    });
  }
  return out;
}

function sources(dir) {
  return fs.readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) return n === "node_modules" || n.startsWith(".") ? [] : sources(p);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(n) ? [p] : [];
  });
}

describe("self-hosted fonts", () => {
  it("nothing imports next/font/google", () => {
    const offenders = ["app", "lib"]
      .flatMap((d) => sources(path.join(ROOT, d)))
      .filter((p) => /(from|import)\s*["']next\/font\/google["']/.test(fs.readFileSync(p, "utf8")))
      .map((p) => path.relative(ROOT, p));
    assert.deepEqual(offenders, []);
  });

  it("every woff2 is byte-identical to what next/font/google shipped", () => {
    const files = fs.readdirSync(FONTS).filter((f) => f.endsWith(".woff2")).sort();
    assert.deepEqual(files, Object.keys(SHA256).sort());
    for (const f of files) {
      const sum = createHash("sha256").update(fs.readFileSync(path.join(FONTS, f))).digest("hex");
      assert.equal(sum, SHA256[f], f);
    }
  });

  for (const [name, s] of Object.entries(STACKS)) {
    it(`${name} runs ${s.subsets.join(", ")}, then the fixed-metric fallback, each subset with Google's range and weights`, () => {
      const all = calls();
      const stack = fontsTs.match(new RegExp(`"${name}": fontStack\\(\\s*\\[([^\\]]*)\\],\\s*"([^"]+)"`));
      assert.ok(stack, `${name} is not built with fontStack`);
      const idents = stack[1].split(",").map((x) => x.trim()).filter(Boolean);
      assert.deepEqual(idents.map((i) => all.get(i)?.files[0]), s.subsets.map((sub) => `${s.file}-${sub}.woff2`));
      for (const [i, ident] of idents.entries()) {
        const c = all.get(ident);
        const sub = s.subsets[i];
        assert.deepEqual(c.weights, s.weights, ident);
        assert.ok(c.files.every((f) => f === `${s.file}-${sub}.woff2`), ident);
        assert.equal(c.range, RANGES[sub], ident);
        assert.equal(c.preload, sub === "latin", `${ident}: only latin is preloaded`);
        assert.match(fontsTs.match(new RegExp(`const ${ident} = localFont\\(\\{[\\s\\S]*?\\n\\}\\);`))[0], /display: "swap"[\s\S]*adjustFontFallback: false/);
      }
      const css = fs.readFileSync(path.join(FONTS, "fallback.css"), "utf8");
      const face = css.match(new RegExp(`@font-face \\{[^}]*"${stack[2]}"[^}]*\\}`))?.[0] ?? "";
      const [ascent, descent, lineGap, size] = s.fallback;
      assert.match(face, /src: local\("Arial"\)/);
      assert.ok(face.includes(`ascent-override: ${ascent};`), face);
      assert.ok(face.includes(`descent-override: ${descent};`), face);
      assert.ok(face.includes(`line-gap-override: ${lineGap};`), face);
      assert.ok(face.includes(`size-adjust: ${size};`), face);
    });
  }

  it("the root layout sets the variables on <html style>", () => {
    const layout = fs.readFileSync(path.join(APP, "layout.tsx"), "utf8");
    assert.match(layout, /import \{[^}]*fontVariables[^}]*\} from ["']\.\/fonts["']/);
    assert.match(layout, /<html[^>]*style=\{fontVariables\}/);
  });

  it("every font family has its OFL licence next to it", () => {
    const files = fs.readdirSync(FONTS);
    for (const s of Object.values(STACKS)) assert.ok(files.includes(`${s.file}-OFL.txt`), s.file);
  });
});
