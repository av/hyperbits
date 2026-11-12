import { parse as parseColor } from "culori";

import type { BitVariable } from "./contracts";

const VARIABLES_ATTR = /data-composition-variables=(['"])([\s\S]*?)\1/;
const SEGMENTS =
  /(<script\b[^>]*>[\s\S]*?<\/script>)|(<style\b[^>]*>[\s\S]*?<\/style>)|(data-composition-variables=(['"])[\s\S]*?\4)/gi;

export const encodeAttributeJson = (value: unknown): string =>
  JSON.stringify(value)
    .replaceAll("'", "\\u0027")
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c");

export const defaultVariableValues = (
  variables: BitVariable[],
): Record<string, unknown> =>
  Object.fromEntries(
    variables.map((variable) => [variable.id, variable.default]),
  );

export const variableValuesAttribute = (
  values: Record<string, unknown>,
): string => `data-variable-values='${encodeAttributeJson(values)}'`;

export const isCssColor = (value: string): boolean =>
  value.trim().length > 0 && parseColor(value.trim()) !== undefined;

export const coerceVariableValue = (
  variable: BitVariable,
  raw: string,
): unknown => {
  if (variable.type === "color") {
    if (!isCssColor(raw)) {
      throw new Error(
        `"${raw}" is not a valid CSS color for ${variable.id} (try #rrggbb, rgb(), hsl(), oklch() or a color name).`,
      );
    }
    return raw.trim();
  }

  if (variable.type === "number") {
    const value = Number(raw);
    if (raw.trim().length === 0 || !Number.isFinite(value)) {
      throw new Error(`"${raw}" is not a number for ${variable.id}.`);
    }
    return value;
  }

  if (variable.type === "boolean") {
    if (raw !== "true" && raw !== "false") {
      throw new Error(`"${raw}" is not true or false for ${variable.id}.`);
    }
    return raw === "true";
  }

  return raw;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

type LiteralPlan = {
  colors: Map<string, string>;
  texts: Map<string, string>;
  warnings: string[];
};

const planLiteralRewrites = (
  variables: BitVariable[],
  overrides: Record<string, unknown>,
): LiteralPlan => {
  const plan: LiteralPlan = {
    colors: new Map(),
    texts: new Map(),
    warnings: [],
  };

  for (const variable of variables) {
    if (!(variable.id in overrides)) {
      continue;
    }
    const isColor = variable.type === "color";
    const isText = variable.type === "string";
    if ((!isColor && !isText) || typeof variable.default !== "string") {
      continue;
    }
    const previous = variable.default;
    const next = String(overrides[variable.id]);
    if (previous.trim().length === 0 || previous === next) {
      continue;
    }

    const conflicts = variables.filter(
      (other) =>
        other.id !== variable.id &&
        other.type === variable.type &&
        typeof other.default === "string" &&
        other.default.toLowerCase() === previous.toLowerCase() &&
        String(overrides[other.id] ?? other.default) !== next,
    );
    if (conflicts.length > 0) {
      plan.warnings.push(
        `${variable.id}: the default ${previous} is shared with ${conflicts
          .map((other) => other.id)
          .join(
            ", ",
          )}, so the literal copies in the markup were left as they are.`,
      );
      continue;
    }

    if (isColor) {
      plan.colors.set(previous.toLowerCase(), next);
    } else {
      plan.texts.set(escapeHtml(previous), escapeHtml(next));
    }
  }

  return plan;
};

const rewriteColors = (text: string, colors: Map<string, string>): string => {
  if (colors.size === 0) {
    return text;
  }
  const pattern = new RegExp(
    `(?<![\\w#-])(?:${[...colors.keys()].map(escapeRegExp).join("|")})(?![\\w-])`,
    "gi",
  );
  return text.replace(
    pattern,
    (match) => colors.get(match.toLowerCase()) ?? match,
  );
};

const rewriteTexts = (markup: string, texts: Map<string, string>): string => {
  if (texts.size === 0) {
    return markup;
  }
  return markup.replace(
    />(\s*)([^<]*?)(\s*)</g,
    (match, leading: string, content: string, trailing: string) => {
      const replacement = texts.get(content);
      return replacement === undefined
        ? match
        : `>${leading}${replacement}${trailing}<`;
    },
  );
};

export interface VariableDefaultsResult {
  html: string;
  variables: BitVariable[];
  warnings: string[];
}

export const applyVariableDefaults = (
  html: string,
  variables: BitVariable[],
  overrides: Record<string, unknown>,
): VariableDefaultsResult => {
  if (!VARIABLES_ATTR.test(html)) {
    throw new Error("The bit HTML has no data-composition-variables.");
  }

  const nextVariables = variables.map((variable) =>
    variable.id in overrides
      ? { ...variable, default: overrides[variable.id] }
      : { ...variable },
  );
  const plan = planLiteralRewrites(variables, overrides);

  const rewriteMarkup = (markup: string): string =>
    rewriteTexts(rewriteColors(markup, plan.colors), plan.texts);

  const segments: string[] = [];
  let cursor = 0;
  for (const match of html.matchAll(SEGMENTS)) {
    const [segment, script, style, declaration] = match;
    segments.push(rewriteMarkup(html.slice(cursor, match.index)));
    if (script) {
      segments.push(script);
    } else if (style) {
      segments.push(rewriteColors(style, plan.colors));
    } else if (declaration) {
      segments.push(
        `data-composition-variables='${encodeAttributeJson(nextVariables)}'`,
      );
    } else {
      segments.push(segment);
    }
    cursor = match.index + segment.length;
  }
  segments.push(rewriteMarkup(html.slice(cursor)));

  return {
    html: segments.join(""),
    variables: nextVariables,
    warnings: plan.warnings,
  };
};
