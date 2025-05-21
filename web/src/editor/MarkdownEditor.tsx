import React, { useRef, useState } from 'react'
// Font-Awesome icons via react-icons
import { FaEdit, FaColumns, FaEye } from 'react-icons/fa'
import CodeMirrorEditor from './CodeMirrorEditor'
import type { CodeMirrorEditorHandle } from './CodeMirrorEditor'
import MarkdownPreview from './MarkdownPreview'
import './MarkdownEditor.css'

type Mode = 'edit' | 'split' | 'preview'

interface Props {
  initialDoc?: string
}

export default function MarkdownEditor({ initialDoc = '' }: Props) {
  const editorRef = useRef<CodeMirrorEditorHandle>(null)

  const [mode, setMode] = useState<Mode>('edit')
  const [doc, setDoc] = useState(initialDoc)

  // pull latest text out of CodeMirror
  const syncDocFromEditor = () => {
    const api = editorRef.current?.textApi
    if (api) setDoc(api.getState().text)
  }

  const changeMode = (m: Mode) => {
    if (m !== 'edit') syncDocFromEditor()   // moving into a preview state
    setMode(m)
  }

  return (
    <div className="md-outer">
      <div className="md-container">
        {/* ─── Toolbar / mode selector ───────────────────────── */}
        <div className="md-toolbar">
          {/* icon, aria-label, active underline via CSS class */}
          {([
            { mode: 'edit',    icon: <FaEdit />,    label: 'Edit'    },
            { mode: 'split',   icon: <FaColumns />, label: 'Split'   },
            { mode: 'preview', icon: <FaEye />,     label: 'Preview' },
          ] as const).map(({ mode: m, icon, label }) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={mode === m ? 'active' : undefined}
              aria-label={label}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* ─── Body ──────────────────────────────────────────── */}
        {mode === 'edit' && (
          <div
            className="cm-wrapper"
            onClick={() => editorRef.current?.focusEnd()}
          >
            <CodeMirrorEditor
              ref={editorRef}
              initialDoc={doc}
              className="cm-theme"
            />
          </div>
        )}

        {mode === 'preview' && <MarkdownPreview content={doc} />}

        {mode === 'split' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            {/* ── left: editor ────────────────────────────────── */}
            <div
              style={{ flex: 1, minWidth: 0 }}
              className="cm-wrapper"
              onClick={() => editorRef.current?.focusEnd()}
            >
              <CodeMirrorEditor
                ref={editorRef}
                initialDoc={doc}
                className="cm-theme"
                onChange={setDoc}  /* live update preview */
              />
            </div>

            {/* ── right: preview ─────────────────────────────── */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                borderLeft: '1px solid #444',
              }}
            >
              <MarkdownPreview content={doc} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}