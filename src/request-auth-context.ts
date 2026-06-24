import { AsyncLocalStorage } from 'node:async_hooks';

export class RancherRequestAuthContext {
  private readonly storage = new AsyncLocalStorage<string | undefined>();

  get currentAuthorizationHeader(): string | undefined {
    return this.storage.getStore();
  }

  async run<T>(authorizationHeader: string | undefined, action: () => Promise<T> | T): Promise<T> {
    return await this.storage.run(authorizationHeader, action);
  }
}
