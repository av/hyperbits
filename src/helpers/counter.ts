import type { GsapProxyBinding } from "./binding";

export type CounterFormatOptions = {
  decimals?: number;
  separator?: string;
  decimal?: string;
  prefix?: string;
  postfix?: string;
};

export function formatNumber(
  value: number,
  options: CounterFormatOptions = {},
): string {
  const decimals = options.decimals ?? 0;
  const decimal = options.decimal ?? ".";
  const separator = options.separator ?? "";
  const prefix = options.prefix ?? "";
  const postfix = options.postfix ?? "";

  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const fixed = absolute.toFixed(decimals);
  const [integerPart, fractionPart] = fixed.split(".");
  const grouped = separator
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : integerPart;
  const body =
    fractionPart !== undefined
      ? `${grouped}${decimal}${fractionPart}`
      : grouped;
  return `${prefix}${sign}${body}${postfix}`;
}

export type CounterProxy = {
  value: number;
};

export type CounterOptions = CounterFormatOptions & {
  from?: number;
};

export function createCounter(
  element: Element,
  options: CounterOptions = {},
): GsapProxyBinding<CounterProxy> {
  const proxy: CounterProxy = { value: options.from ?? 0 };
  const apply = () => {
    element.textContent = formatNumber(proxy.value, options);
  };
  apply();
  return { proxy, apply };
}
