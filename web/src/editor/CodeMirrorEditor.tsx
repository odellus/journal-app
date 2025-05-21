import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
} from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { createMarkdownExtensions } from './codemirrorSetup';
import { CodeMirrorTextApi } from './CodeMirrorTextApi';
import { CodeMirrorCommandOrchestrator } from './CodeMirrorCommandOrchestrator';

export interface CodeMirrorEditorHandle {
  textApi: CodeMirrorTextApi;
  orchestrator: CodeMirrorCommandOrchestrator;
  focusEnd: () => void;
}

interface Props {
  initialDoc?: string;
  className?: string;
  onChange?: (doc: string) => void;
}

const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, Props>((props, ref) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // we store the handle in state so we can create it inside useEffect
  const [handle, setHandle] = useState<CodeMirrorEditorHandle | null>(
    null,
  );

  useEffect(() => {
    if (!wrapRef.current) return;

    const startState = EditorState.create({
      doc: props.initialDoc ?? '',
      extensions: [
        basicSetup,
        ...createMarkdownExtensions(),
        EditorView.updateListener.of(update => {
          if (update.docChanged && props.onChange) {
            props.onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: wrapRef.current,
    });

    viewRef.current = view;
    // create the real handle *after* view exists
    setHandle({
      textApi: new CodeMirrorTextApi(view),
      orchestrator: new CodeMirrorCommandOrchestrator(view),
      focusEnd: () => {
        const pos = view.state.doc.length;
        view.dispatch({ selection: { anchor: pos } });
        view.focus();
      },
    });

    return () => view.destroy();
  }, []);

  // expose whatever we have; parent will wait until it's non-null
  useImperativeHandle(ref, () => {
    if (!handle) {
      // return a dummy object so TypeScript is happy; parent code
      // must check for nulls anyway
      return {} as unknown as CodeMirrorEditorHandle;
    }
    return handle;
  }, [handle]);

  return <div ref={wrapRef} className={props.className} />;
});

CodeMirrorEditor.displayName = 'CodeMirrorEditor';
export default CodeMirrorEditor;