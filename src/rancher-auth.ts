import { Buffer } from 'node:buffer';
import { RancherRequestAuthContext } from './request-auth-context.js';

export interface RancherAuthConfig {
  token?: string;
  username?: string;
  password?: string;
}

export class RancherAuthService {
  constructor(
    private readonly authContext: RancherRequestAuthContext,
    private readonly config: RancherAuthConfig = {},
  ) {}

  getAuthorizationHeader(): string | undefined {
    const incoming = this.authContext.currentAuthorizationHeader?.trim();
    if (incoming) {
      return incoming;
    }

    if (this.config.token?.trim()) {
      return `Bearer ${this.config.token.trim()}`;
    }

    if (this.config.username?.trim() && this.config.password !== undefined) {
      const credentials = Buffer.from(`${this.config.username.trim()}:${this.config.password}`, 'utf8').toString('base64');
      return `Basic ${credentials}`;
    }

    return undefined;
  }
}
