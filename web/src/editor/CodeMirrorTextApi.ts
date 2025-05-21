import { EditorView } from '@codemirror/view';

export interface TextRange {
  start: number;
  end: number;
}

export interface TextState {
  text: string;
  selection: TextRange;
}

export class CodeMirrorTextApi {
  private view: EditorView;

  constructor(view: EditorView) {
    this.view = view;
  }

  /** Replace current selection with the provided text */
  replaceSelection(text: string): TextState {
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    return this.getState();
  }

  /** Programmatically select a range */
  setSelectionRange(selection: TextRange): TextState {
    this.view.dispatch({
      selection: { anchor: selection.start, head: selection.end },
      scrollIntoView: true,
    });
    this.view.focus();
    return this.getState();
  }

  /** Helper – return entire editor text + current selection */
  getState(): TextState {
    const doc = this.view.state.doc.toString();
    const sel = this.view.state.selection.main;
    return { text: doc, selection: { start: sel.from, end: sel.to } };
  }
}