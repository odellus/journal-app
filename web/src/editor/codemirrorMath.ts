import { EditorView, ViewPlugin, ViewUpdate, DecorationSet, Decoration } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/rangeset'
import katex from 'katex'

/**
 * Inline `$…$`  or block `$$…$$` → KaTeX widget implementation.
 */
function buildMathDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const doc = view.state.doc.toString()

  // RegExp that finds both `$$block$$` (multiline) and `$inline$`
  const regex = /\$\$([\s\S]+?)\$\$|\$([^\n]+?)\$/g
  for (let m; (m = regex.exec(doc)); ) {
    const from = m.index
    const to = from + m[0].length
    const formula = m[1] ?? m[2] // 1=block, 2=inline

    const widget = Decoration.widget({
      side: 1,
      block: !!m[1], // block formula gets its own line
      render: () => {
        const span = document.createElement('span')
        try {
          katex.render(formula, span, {
            displayMode: !!m[1],
            throwOnError: false,
          })
        } catch {
          span.textContent = formula // fallback: raw text
        }
        span.style.pointerEvents = 'none' // keep text selection working
        return span
      },
    })

    // Replace the original text with the rendered widget
    builder.add(from, to, widget)
  }

  return builder.finish()
}

/**
 * A ViewPlugin that recomputes KaTeX decorations whenever the document
 * or viewport changes.
 */
export const mathExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildMathDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildMathDecorations(update.view)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    provide: (plugin) => EditorView.decorations.from(plugin),
  },
)