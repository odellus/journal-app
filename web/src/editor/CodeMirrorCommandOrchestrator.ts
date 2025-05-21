import type { ICommand, ExecuteCommandState } from '../commands'; // existing types
import { CodeMirrorTextApi } from './CodeMirrorTextApi';
import { EditorView } from '@codemirror/view';
import React from 'react';
import type { ContextStore } from '../store'; // wherever your context store lives

export class CodeMirrorCommandOrchestrator {
  private view: EditorView;
  private textApi: CodeMirrorTextApi;

  constructor(view: EditorView) {
    this.view = view;
    this.textApi = new CodeMirrorTextApi(view);
  }

  getState() {
    if (!this.view) return false;
    return this.textApi.getState();
  }

  executeCommand(
    command: ICommand<string>,
    dispatch?: React.Dispatch<ContextStore>,
    state?: ExecuteCommandState,
    shortcuts?: string[],
  ) {
    command.execute &&
      command.execute({ command, ...this.textApi.getState() }, this.textApi, dispatch, state, shortcuts);
  }
}