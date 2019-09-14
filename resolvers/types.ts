export interface LambdaEvent {
  context: {
    arguments: { [key: string]: any };
    identity: object | null;
    source: object | null;
    result: object | null;
    request: {
      headers: {
        [key: string]: string;
      };
    };
    error: object | null;
    prev: object | null;
    stash: object;
    outErrors: [object];
  };
}
