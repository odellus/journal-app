import { EditorView, keymap } from '@codemirror/view'
import {
  defaultKeymap,
  indentWithTab,
} from '@codemirror/commands'
import {
  autocompletion,
  acceptCompletion,
  startCompletion,
} from '@codemirror/autocomplete'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'

// ───── type-only imports ────────────────────────────────────────────────────
import type { Extension, EditorState } from '@codemirror/state'
import type {
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete'
// ────────────────────────────────────────────────────────────────────────────

// ───── helper: safe slice of the document ───────────────────────────────────
const MAX_CTX = 2000
const slice = (state: EditorState, from: number, to: number) =>
  state.sliceDoc(Math.max(0, from), Math.min(state.doc.length, to))

/**
 * Remote completion source that talks to localhost Ollama (model: qwen3).
 * Sends up to 2 000 chars of context (1 000 before & after).
 */
async function aiCompletion(
  context: CompletionContext,
): Promise<CompletionResult | null> {
  // ─── when should we fire? ────────────────────────────────────────────────
  const prefixMatch = context.matchBefore(/\w+$/)
  if (!prefixMatch && !context.explicit) return null
  const prefix = prefixMatch ? prefixMatch.text : ''

  // ─── collect surrounding text ────────────────────────────────────────────
  const before = slice(context.state, context.pos - MAX_CTX, context.pos)
  const after = slice(context.state, context.pos, context.pos + MAX_CTX)

  // ─── build prompt ────────────────────────────────────────────────────────
  const system_prompt =
    "You are a helpful assistant. You will complete the user's thoughts. /no_think"

  const prompt = [
    '=== BEFORE CURSOR ===',
    before || '<BOF>',
    '',
    '=== CURSOR WORD ===',
    prefix || '<EMPTY>',
    '',
    '=== AFTER CURSOR ===',
    after || '<EOF>',
    '',
  ].join('\n')

  // ─── call Ollama (qwen3) ─────────────────────────────────────────────────
  const res = await fetch(
    'http://localhost:11434/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ollama',
      },
      body: JSON.stringify({
        model: 'qwen3',
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: prompt },
          { role: 'prefill', content: prefix },
        ],
        max_tokens: 60,
      }),
    },
  ).then(r => r.json())

  // ─── parse & clean model output ──────────────────────────────────────────
  const raw: string = res?.choices?.[0]?.message?.content ?? ''
  let clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, '') // remove inner monologue
  clean = clean.replace(/^[\s\r\n]+/, '')                  // no leading blank lines

  // ─── de-duplicate against document ───────────────────────────────────────
  const beforeText = before
  const afterText = after

  // longest suffix of before that equals a prefix of clean
  let frontOverlap = 0
  for (
    let i = 1;
    i <= clean.length && i <= beforeText.length;
    i++
  ) {
    if (beforeText.slice(-i) === clean.slice(0, i)) frontOverlap = i
  }

  // longest suffix of clean that equals a prefix of after
  let backOverlap = 0
  for (
    let i = 1;
    i <= clean.length && i <= afterText.length;
    i++
  ) {
    if (clean.slice(-i) === afterText.slice(0, i)) backOverlap = i
  }

  const insertText = clean.slice(
    frontOverlap,
    clean.length - backOverlap,
  )

  if (!insertText) return null // nothing new -> no suggestion

  const options = [
    {
      label: insertText,
      type: 'text',
      apply: insertText,
    },
  ]

  // ─── replace range: we *append* (keep what user typed) ───────────────────
  const from = context.pos

  return {
    from,
    options,
  }
}

/* ─────────────────── SINGLE, REUSABLE EXTENSION SET ────────────────────── */

const tabBehaviour = {
  key: 'Tab',
  run: (view: EditorView) =>
    acceptCompletion(view) || startCompletion(view),
}

const MARKDOWN_EXTENSIONS: Extension[] = [
  keymap.of([tabBehaviour, indentWithTab]),
  keymap.of(defaultKeymap),
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  autocompletion({ override: [aiCompletion] }),
  EditorView.lineWrapping,
  oneDark,
]

/**
 * Re-exported for compatibility; same array instance every call
 * eliminates quadratic slowdown.
 */
export const createMarkdownExtensions = (): Extension[] =>
  MARKDOWN_EXTENSIONS

// Modern callers can import this directly
export const markdownExtensions = MARKDOWN_EXTENSIONS