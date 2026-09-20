export type CompositionVariableType = 'string' | 'number' | 'color' | 'boolean';

export type CompositionVariable = {
  id: string;
  type: CompositionVariableType | string;
  label?: string;
  default?: unknown;
};

const VARIABLES_ATTR = /data-composition-variables=(['"])([\s\S]*?)\1/;

export function parseCompositionVariables(html: string): CompositionVariable[] {
  const match = html.match(VARIABLES_ATTR);
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[2]) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is CompositionVariable =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as CompositionVariable).id === 'string',
    );
  } catch {
    return [];
  }
}

export function defaultsFromVariables(
  variables: CompositionVariable[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const variable of variables) {
    values[variable.id] = variable.default;
  }
  return values;
}

export function applyCompositionVariables(
  html: string,
  values: Record<string, unknown>,
): string {
  const variables = parseCompositionVariables(html);
  if (variables.length === 0) {
    return html;
  }

  const next = variables.map((variable) => ({
    ...variable,
    default:
      values[variable.id] === undefined ? variable.default : values[variable.id],
  }));

  const encoded = JSON.stringify(next);
  if (VARIABLES_ATTR.test(html)) {
    return html.replace(VARIABLES_ATTR, `data-composition-variables='${encoded}'`);
  }

  return html.replace(
    /<html\b([^>]*)>/i,
    `<html$1 data-composition-variables='${encoded}'>`,
  );
}
