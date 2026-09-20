import Prism from "prismjs";
import { unitProgress } from "./math";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-python.js";

export type LineRange = number | [number, number];

export type CodeBlockOptions = {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
};

export function isLineInRange(lineIndex: number, range: LineRange): boolean {
  const [start, end] = Array.isArray(range) ? range : [range, range];
  const lineNumber = lineIndex + 1;
  return lineNumber >= start && lineNumber <= end;
}

function grammarFor(language: string): Prism.Grammar {
  const languages = Prism.languages as Record<
    string,
    Prism.Grammar | undefined
  >;
  return languages[language] ?? languages.javascript ?? languages.markup ?? {};
}

export function createCodeBlock(
  container: Element,
  options: CodeBlockOptions,
): HTMLElement {
  const language = options.language ?? "javascript";
  const grammar = grammarFor(language);
  const highlighted = Prism.highlight(options.code ?? "", grammar, language);
  const highlightedLines = highlighted.split("\n");

  const pre = document.createElement("pre");
  pre.className = `language-${language} hyperbits-code`;
  const codeElement = document.createElement("code");
  codeElement.className = `language-${language}`;

  for (let index = 0; index < highlightedLines.length; index++) {
    const line = document.createElement("span");
    line.className = "hyperbits-code-line";
    line.dataset.line = String(index + 1);
    line.style.display = "block";
    line.style.opacity = "1";

    if (options.showLineNumbers) {
      const gutter = document.createElement("span");
      gutter.className = "hyperbits-code-gutter";
      gutter.textContent = String(index + 1);
      gutter.setAttribute("aria-hidden", "true");
      line.append(gutter);
    }

    const content = document.createElement("span");
    content.className = "hyperbits-code-content";
    content.innerHTML = highlightedLines[index] || " ";
    line.append(content);
    codeElement.append(line);
  }

  pre.append(codeElement);
  container.append(pre);
  return pre;
}

export function codeLines(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".hyperbits-code-line"));
}

export type LineRevealOptions = {
  duration: number;
  stagger?: number;
  delay?: number;
};

export function applyLineReveal(
  root: Element,
  time: number,
  options: LineRevealOptions,
): void {
  const lines = codeLines(root);
  const stagger = options.stagger ?? 0;
  const delay = options.delay ?? 0;
  const duration = options.duration;

  for (let index = 0; index < lines.length; index++) {
    const start = delay + index * stagger;
    let progress = 1;
    if (duration > 0) {
      progress = unitProgress((time - start) / duration);
    } else if (time < start) {
      progress = 0;
    }
    lines[index].style.opacity = String(progress);
  }
}

export type LineFocusOptions = {
  dimOpacity?: number;
  dimBlur?: number;
};

export function applyLineFocus(
  root: Element,
  range: LineRange,
  options: LineFocusOptions = {},
): void {
  const dimOpacity = options.dimOpacity ?? 0.3;
  const dimBlur = options.dimBlur ?? 2;
  const lines = codeLines(root);

  for (let index = 0; index < lines.length; index++) {
    const focused = isLineInRange(index, range);
    lines[index].style.opacity = focused ? "1" : String(dimOpacity);
    lines[index].style.filter =
      focused || dimBlur <= 0 ? "" : `blur(${dimBlur}px)`;
  }
}
