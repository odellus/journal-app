import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

import 'katex/dist/katex.min.css'
import 'github-markdown-css'          // keeps GitHub-like HTML defaults
import './MarkdownPreview.css'        // ← NEW  (see step-2)

interface Props {
  content: string
}

// custom rendering for links → open in a new tab
const components = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  ),
}

export default function MarkdownPreview({ content }: Props) {
  // add our own class; keep “markdown-body” so GitHub theme still applies
  return (
    <div className="md-preview markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}        /* ← replaces deprecated linkTarget */
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}