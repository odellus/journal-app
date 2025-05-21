import React from 'react'
import MarkdownEditor from './editor/MarkdownEditor'
import 'katex/dist/katex.min.css'

export default function App() {
  return (
    <div style={{ height: '100vh', margin: 0 }}>
      <MarkdownEditor />
    </div>
  )
}
