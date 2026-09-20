import { unitProgress } from "./math";

export type SplitMode = "chars" | "words" | "lines";

const CHAR_ATTR = "data-char";

export function splitUnits(text: string, mode: SplitMode): string[] {
  if (mode === "words")
    return text.split(/(\s+)/).filter((part) => part.length > 0);
  if (mode === "lines") {
    const parts = text.split(/(\n)/);
    return parts.filter((part) => part.length > 0);
  }
  return Array.from(text);
}

export function splitText(
  element: Element,
  mode: SplitMode = "chars",
): HTMLSpanElement[] {
  const text = element.textContent ?? "";
  element.setAttribute("aria-label", text);
  element.textContent = "";

  const units = splitUnits(text, mode);
  const spans: HTMLSpanElement[] = [];

  for (const unit of units) {
    const span = document.createElement("span");
    span.textContent = unit;
    span.setAttribute("aria-hidden", "true");
    span.style.whiteSpace = "pre";
    if (mode === "lines") {
      span.style.display = "block";
    } else {
      span.style.display = "inline-block";
    }
    if (mode === "chars") {
      span.setAttribute(CHAR_ATTR, String(spans.length));
    }
    element.append(span);
    spans.push(span);
  }

  return spans;
}

export function charsVisibleAt(
  time: number,
  options: { total: number; duration: number; delay?: number },
): number {
  const delay = options.delay ?? 0;
  if (options.total <= 0) return 0;
  if (time <= delay) return 0;
  if (options.duration <= 0) return options.total;
  const progress = unitProgress((time - delay) / options.duration);
  if (progress >= 1) return options.total;
  return Math.floor(progress * options.total);
}

export type TypewriterOptions = {
  duration: number;
  delay?: number;
};

export function applyTypewriter(
  element: Element,
  time: number,
  options: TypewriterOptions,
): number {
  let spans = Array.from(
    element.querySelectorAll<HTMLSpanElement>(`[${CHAR_ATTR}]`),
  );
  if (spans.length === 0) {
    spans = splitText(element, "chars");
  }

  const visible = charsVisibleAt(time, {
    total: spans.length,
    duration: options.duration,
    delay: options.delay,
  });

  for (let index = 0; index < spans.length; index++) {
    spans[index].style.visibility = index < visible ? "visible" : "hidden";
  }

  return visible;
}

export type TypewriterDriver = {
  apply: (time: number) => number;
  spans: HTMLSpanElement[];
};

export function typewriter(
  element: Element,
  options: TypewriterOptions,
): TypewriterDriver {
  const spans = splitText(element, "chars");
  return {
    spans,
    apply(time: number) {
      return applyTypewriter(element, time, options);
    },
  };
}
