export interface ExecuteCommandState {
    [key: string]: unknown
  }
  
  export interface ICommand<T = string> {
    execute?: (
      ctx: { command: ICommand<T>; [key: string]: unknown },
      api: unknown,
      dispatch?: unknown,
      state?: ExecuteCommandState,
      shortcuts?: string[],
    ) => void
  }
  