export type BitSize = { width: number; height: number };

export const SIZE_ALIASES: Readonly<Record<string, BitSize>> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};

const MAX_DIMENSION = 7680;

export const formatSize = (size: BitSize): string =>
  `${size.width}x${size.height}`;

export const parseSize = (value: string): BitSize => {
  const normalized = value.trim().toLowerCase();
  const alias = SIZE_ALIASES[normalized];
  if (alias) return { ...alias };

  const match = normalized.match(/^(\d+)\s*[x×]\s*(\d+)$/);
  const width = match ? Number(match[1]) : Number.NaN;
  const height = match ? Number(match[2]) : Number.NaN;
  const valid = [width, height].every(
    (dimension) =>
      Number.isInteger(dimension) &&
      dimension >= 1 &&
      dimension <= MAX_DIMENSION,
  );
  if (!valid) {
    throw new Error(
      `Invalid size "${value}". Use WIDTHxHEIGHT (for example 1080x1920) or one of ${Object.keys(SIZE_ALIASES).join(", ")}.`,
    );
  }
  return { width, height };
};

export const readBitSize = (html: string): BitSize | null => {
  const root = findRootTag(html);
  if (!root) return null;
  const width = Number(readAttribute(root.tag, "data-width"));
  const height = Number(readAttribute(root.tag, "data-height"));
  if (!(width > 0) || !(height > 0)) return null;
  return { width, height };
};

type RootTag = { tag: string; index: number };

const findRootTag = (html: string): RootTag | null => {
  const match = /<[a-zA-Z][\w-]*\b[^>]*\sdata-composition-id\s*=[^>]*>/.exec(
    html,
  );
  return match ? { tag: match[0], index: match.index } : null;
};

const readAttribute = (tag: string, name: string): string | null => {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`));
  return match ? match[1] : null;
};

const setAttribute = (tag: string, name: string, value: string): string => {
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(["'])[^"']*\\2`);
  if (pattern.test(tag)) {
    return tag.replace(pattern, `$1$2${value}$2`);
  }
  return tag.replace(/\s*(\/?)>$/, ` ${name}="${value}"$1>`);
};

const rewriteRoot = (html: string, size: BitSize): string => {
  const root = findRootTag(html);
  if (!root) {
    throw new Error("Bit HTML has no element with data-composition-id.");
  }
  let tag = setAttribute(root.tag, "data-width", String(size.width));
  tag = setAttribute(tag, "data-height", String(size.height));
  return (
    html.slice(0, root.index) + tag + html.slice(root.index + root.tag.length)
  );
};

const rewriteMetaViewport = (html: string, size: BitSize): string =>
  html.replace(/<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/gi, (meta) =>
    meta.replace(
      /(\bcontent\s*=\s*)(["'])([^"']*)\2/i,
      (_whole, prefix: string, quote: string, content: string) => {
        const parts = content
          .split(",")
          .map((part) => part.trim())
          .filter(
            (part) => part.length > 0 && !/^(width|height)\s*=/i.test(part),
          );
        const next = [
          `width=${size.width}`,
          `height=${size.height}`,
          ...parts,
        ].join(", ");
        return `${prefix}${quote}${next}${quote}`;
      },
    ),
  );

const STAGE_SELECTORS = new Set([":root", "html", "body", "#root"]);

const rewriteStageRules = (css: string, original: BitSize, size: BitSize) =>
  css.replace(
    /([^{}]+)\{([^{}]*)\}/g,
    (rule, selector: string, body: string) => {
      const selectors = selector.split(",").map((part) => part.trim());
      if (!selectors.some((part) => STAGE_SELECTORS.has(part))) {
        return rule;
      }
      const nextBody = body
        .replace(
          /(^|[;\s])((?:min-|max-)?width\s*:\s*)(\d+(?:\.\d+)?)px/g,
          (whole, lead: string, property: string, value: string) =>
            Number(value) === original.width
              ? `${lead}${property}${size.width}px`
              : whole,
        )
        .replace(
          /(^|[;\s])((?:min-|max-)?height\s*:\s*)(\d+(?:\.\d+)?)px/g,
          (whole, lead: string, property: string, value: string) =>
            Number(value) === original.height
              ? `${lead}${property}${size.height}px`
              : whole,
        );
      return `${selector}{${nextBody}}`;
    },
  );

const rewriteStyles = (html: string, original: BitSize, size: BitSize) =>
  html.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_whole, open: string, css: string, close: string) =>
      `${open}${rewriteStageRules(css, original, size)}${close}`,
  );

export const retargetBitHtml = (html: string, size: BitSize): string => {
  const original = readBitSize(html);
  if (!original) {
    throw new Error(
      "Bit HTML has no root element with data-width and data-height.",
    );
  }
  if (original.width === size.width && original.height === size.height) {
    return html;
  }
  return rewriteStyles(
    rewriteMetaViewport(rewriteRoot(html, size), size),
    original,
    size,
  );
};
