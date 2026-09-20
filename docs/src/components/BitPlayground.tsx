import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { flexoki } from '../lib/editor-theme';
import { docsBitsById, type DocsBit } from '../lib/bits.generated';
import {
  applyCompositionVariables,
  defaultsFromVariables,
  parseCompositionVariables,
  type CompositionVariable,
} from '../lib/composition-variables';
import {
  loadHyperframesPlayer,
  type HyperframesPlayerElement,
} from '../lib/player';

interface BitPlaygroundProps {
  bitName: string;
}

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="sl-badge default small">{label}</span>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    style={{ width: '1em', height: '1em' }}
  >
    <path d="M3 19a2 2 0 0 1-1-2V2a2 2 0 0 1 1-1h13a2 2 0 0 1 2 1" />
    <rect x="6" y="5" width="16" height="18" rx="1.5" ry="1.5" />
  </svg>
);

const UndoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    style={{ width: '1em', height: '1em' }}
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const useDebouncedValue = <Value,>(value: Value, delay: number): Value => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export const BitPlayground: React.FC<BitPlaygroundProps> = ({ bitName }) => {
  const bit: DocsBit | undefined = docsBitsById[bitName];
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HyperframesPlayerElement | null>(null);
  const [sourceHtml, setSourceHtml] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, unknown>>(
    {},
  );

  useEffect(() => {
    if (!bit) return;
    let canceled = false;
    void fetch(bit.htmlPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${bit.htmlPath}`);
        }
        return response.text();
      })
      .then((htmlSource) => {
        if (canceled) return;
        setSourceHtml(htmlSource);
        setVariableValues(
          defaultsFromVariables(parseCompositionVariables(htmlSource)),
        );
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      canceled = true;
    };
  }, [bit]);

  const variables: CompositionVariable[] = useMemo(
    () => parseCompositionVariables(sourceHtml),
    [sourceHtml],
  );
  const previewHtml = useMemo(
    () => applyCompositionVariables(sourceHtml, variableValues),
    [sourceHtml, variableValues],
  );
  const debouncedHtml = useDebouncedValue(previewHtml, 300);
  const originalHtmlRef = useRef('');
  if (sourceHtml && !originalHtmlRef.current) {
    originalHtmlRef.current = sourceHtml;
  }

  useEffect(() => {
    const host = playerHostRef.current;
    if (!host || !bit || !debouncedHtml) return;

    let canceled = false;

    void loadHyperframesPlayer().then(() => {
      if (canceled || !playerHostRef.current) return;
      let player = playerRef.current;
      if (!player) {
        player = document.createElement(
          'hyperframes-player',
        ) as HyperframesPlayerElement;
        player.setAttribute('width', String(bit.width));
        player.setAttribute('height', String(bit.height));
        player.setAttribute('controls', '');
        player.setAttribute('loop', '');
        player.setAttribute('autoplay', '');
        player.setAttribute('muted', '');
        player.setAttribute('style', 'width:100%;height:100%;display:block;');
        playerHostRef.current.replaceChildren(player);
        playerRef.current = player;
      }
      player.setAttribute('srcdoc', debouncedHtml);
    });

    return () => {
      canceled = true;
    };
  }, [bit, debouncedHtml]);

  useEffect(() => {
    return () => {
      playerRef.current = null;
      playerHostRef.current?.replaceChildren();
    };
  }, []);

  const handleReset = useCallback(() => {
    const original = originalHtmlRef.current;
    setSourceHtml(original);
    setVariableValues(defaultsFromVariables(parseCompositionVariables(original)));
  }, []);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(sourceHtml).then(() => {
      window.alert('Bit HTML copied to clipboard.');
    });
  }, [sourceHtml]);

  const handleVariableChange = useCallback((id: string, value: unknown) => {
    setVariableValues((current) => ({ ...current, [id]: value }));
  }, []);

  if (!bit) {
    return <div className="bit-playground-error">Error: Bit not found</div>;
  }

  const isModified = sourceHtml !== originalHtmlRef.current && originalHtmlRef.current.length > 0;

  return (
    <div className="bit-playground not-content">
      {variables.length > 0 && (
        <div className="bit-playground-controls">
          <div className="bit-playground-controls-header">Controls</div>
          <div className="bit-playground-controls-grid">
            {variables.map((variable) => {
              const value = variableValues[variable.id] ?? variable.default;
              return (
                <div key={variable.id} className="bit-playground-control">
                  <label className="bit-playground-control-label">
                    {variable.label || variable.id}
                  </label>
                  {variable.type === 'number' && (
                    <input
                      type="number"
                      value={typeof value === 'number' ? value : Number(value ?? 0)}
                      onChange={(event) =>
                        handleVariableChange(
                          variable.id,
                          Number.parseFloat(event.target.value),
                        )
                      }
                      className="bit-playground-control-input"
                    />
                  )}
                  {variable.type === 'color' && (
                    <input
                      type="color"
                      value={typeof value === 'string' ? value : '#000000'}
                      onChange={(event) =>
                        handleVariableChange(variable.id, event.target.value)
                      }
                      className="bit-playground-control-color"
                    />
                  )}
                  {variable.type === 'boolean' && (
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) =>
                        handleVariableChange(variable.id, event.target.checked)
                      }
                      className="bit-playground-control-checkbox"
                    />
                  )}
                  {(variable.type === 'string' ||
                    (variable.type !== 'number' &&
                      variable.type !== 'color' &&
                      variable.type !== 'boolean')) && (
                    <input
                      type="text"
                      value={value == null ? '' : String(value)}
                      onChange={(event) =>
                        handleVariableChange(variable.id, event.target.value)
                      }
                      className="bit-playground-control-input"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bit-playground-content">
        <div className="bit-playground-preview-section">
          <div className="bit-playground-preview">
            <div className="bit-playground-player-container">
              {loadError ? (
                <div className="bit-playground-error">{loadError}</div>
              ) : (
                <div ref={playerHostRef} className="bit-playground-player-host" />
              )}
            </div>
          </div>
        </div>

        <div className="bit-playground-code-section">
          <CodeMirror
            value={sourceHtml}
            height="300px"
            theme={flexoki}
            extensions={[html()]}
            onChange={setSourceHtml}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />

          {isModified && (
            <button
              className="bit-playground-action-btn"
              onClick={handleReset}
              type="button"
              title="Reset to original HTML"
            >
              <UndoIcon />
            </button>
          )}
          <button
            className="bit-playground-action-btn"
            onClick={handleCopy}
            type="button"
            title="Copy bit HTML"
          >
            <CopyIcon />
          </button>
        </div>
      </div>

      <div className="bit-playground-metadata">
        <div className="bit-playground-meta-item">
          {bit.duration}s · {bit.width}×{bit.height}
        </div>
        <div className="bit-playground-meta-item">
          <span className="bit-playground-badges">
            {bit.tags.map((tag) => (
              <a
                key={tag}
                href={`/docs/bits-catalog?tag=${encodeURIComponent(tag)}`}
                className="bit-playground-tag-link"
              >
                <Badge label={tag} />
              </a>
            ))}
          </span>
        </div>
      </div>

      <style>{`
        .bit-playground {
          border: 1px solid var(--sl-color-gray-5);
          border-radius: 0.5rem;
          overflow: hidden;
          margin: 2rem 0;
        }

        .bit-playground-controls {
          padding: 1rem 1.5rem;
          background: var(--sl-color-gray-6);
          border-bottom: 1px solid var(--sl-color-gray-5);
        }

        .bit-playground-controls-header {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--sl-color-white);
          margin-bottom: 0.75rem;
        }

        .bit-playground-controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .bit-playground-control {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .bit-playground-control-label {
          font-size: 0.75rem;
          color: var(--sl-color-gray-2);
          font-weight: 500;
        }

        .bit-playground-control-input {
          padding: 0.375rem 0.5rem;
          background: var(--sl-color-gray-5);
          border: 1px solid var(--sl-color-gray-4);
          border-radius: 0.25rem;
          color: var(--sl-color-white);
          font-size: 0.875rem;
        }

        .bit-playground-control-input:focus {
          outline: none;
          border-color: var(--sl-color-accent);
        }

        .bit-playground-control-color {
          width: 100%;
          height: 2.5rem;
          padding: 0.25rem;
          background: var(--sl-color-gray-5);
          border: 1px solid var(--sl-color-gray-4);
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .bit-playground-control-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        .bit-playground-action-btn {
          position: absolute;
          top: 1rem;
          width: 2rem;
          height: 2rem;
          padding: 0;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          color: var(--sl-color-gray-2);
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bit-playground-action-btn:first-of-type {
          right: 2.5rem;
        }

        .bit-playground-action-btn:last-of-type {
          right: 0.25rem;
        }

        .bit-playground-action-btn:hover {
          opacity: 1;
          background: var(--sl-color-gray-5);
          border-color: var(--sl-color-gray-4);
          color: var(--sl-color-white);
        }

        .bit-playground-content {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--sl-color-bg);
        }

        .bit-playground-code-section,
        .bit-playground-preview-section {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }

        .bit-playground-code-section {
          border-right: 1px solid var(--sl-color-gray-5);
          overflow: hidden;
        }

        .bit-playground-preview-section {
          overflow: hidden;
          aspect-ratio: 16 / 9;
        }

        .bit-playground-error {
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
          color: rgb(252, 165, 165);
          font-size: 0.875rem;
          line-height: 1.5;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        .bit-playground-preview {
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--sl-color-black);
          min-height: 200px;
          flex: 1;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
        }

        .bit-playground-player-container,
        .bit-playground-player-host {
          width: 100%;
          height: 100%;
        }

        .bit-playground-metadata {
          padding: 0.25rem 0.5rem;
          opacity: 0.5;
          background: var(--sl-color-gray-6);
          border-top: 1px solid var(--sl-color-gray-5);
          display: flex;
          justify-content: space-between;
          gap: 2rem;
          font-size: 0.75rem;
        }

        .bit-playground-meta-item {
          color: var(--sl-color-gray-2);
        }

        .bit-playground-tag-link {
          text-decoration: none;
          color: inherit;
        }

        .bit-playground-tag-link:hover {
          opacity: 0.8;
          text-decoration: none;
        }

        @media (max-width: 1024px) {
          .bit-playground-code-section {
            border-right: none;
            border-bottom: 1px solid var(--sl-color-gray-5);
          }
        }

        .bit-playground-code-section .cm-editor {
          font-size: 0.875rem;
        }

        .bit-playground-code-section .cm-scroller {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }
      `}</style>
    </div>
  );
};
