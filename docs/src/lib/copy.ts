const RESET_MS = 1600;

function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.left = '-9999px';
  area.style.opacity = '0';
  document.body.appendChild(area);
  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  area.select();
  area.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  area.remove();
  if (previous && selection) {
    selection.removeAllRanges();
    selection.addRange(previous);
  }
  return copied;
}

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return copyWithSelection(text);
    }
  }
  return copyWithSelection(text);
}

function announce(message: string) {
  let region = document.getElementById('copy-status');
  if (!region) {
    region = document.createElement('div');
    region.id = 'copy-status';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    document.body.appendChild(region);
  }
  region.textContent = '';
  region.textContent = message;
}

const timers = new WeakMap<Element, number>();

export function showCopyState(element: Element, copied: boolean) {
  const label = element.querySelector<HTMLElement>('[data-copy-label]');
  if (label && !label.dataset.copyIdle) label.dataset.copyIdle = label.textContent ?? '';
  element.setAttribute('data-copy-state', copied ? 'copied' : 'failed');
  if (label) label.textContent = copied ? 'Copied' : 'Press Ctrl+C';
  announce(copied ? 'Copied to clipboard' : 'Copy failed, select the text and press Ctrl+C');
  const previous = timers.get(element);
  if (previous) window.clearTimeout(previous);
  timers.set(
    element,
    window.setTimeout(() => {
      element.removeAttribute('data-copy-state');
      if (label) label.textContent = label.dataset.copyIdle ?? '';
    }, RESET_MS),
  );
}

export function wireCopyElements(root: ParentNode = document) {
  const activate = async (element: HTMLElement) => {
    const text = element.dataset.copy ?? '';
    showCopyState(element, await copyText(text));
  };
  root.addEventListener('click', (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>('[data-copy]');
    if (!element) return;
    event.preventDefault();
    void activate(element);
  });
  root.addEventListener('keydown', (event) => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key !== 'Enter' && keyboard.key !== ' ') return;
    const element = (keyboard.target as Element | null)?.closest<HTMLElement>('[data-copy]');
    if (!element || element.tagName === 'BUTTON') return;
    keyboard.preventDefault();
    void activate(element);
  });
}
