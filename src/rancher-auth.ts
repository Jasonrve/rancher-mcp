import { Buffer } from 'node:buffer';
import { RancherRequestAuthContext } from './request-auth-context.js';

export interface RancherAuthConfig {
  baseUrl: string;
  token?: string;
  username?: string;
  password?: string;
  fetchImpl?: typeof fetch;
}

export class RancherAuthService {
  private readonly fetchImpl: typeof fetch;
  private cachedToken?: string;
  private tokenExpiry = 0;

  constructor(
    private readonly authContext: RancherRequestAuthContext,
    private readonly config: RancherAuthConfig,
  ) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async getAuthorizationHeader(): Promise<string | undefined> {
    const incoming = this.authContext.currentAuthorizationHeader?.trim();
    if (incoming) {
      return incoming;
    }

    if (this.config.token?.trim()) {
      return `Bearer ${this.config.token.trim()}`;
    }

    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return `Bearer ${this.cachedToken}`;
    }

    if (this.config.username?.trim() && this.config.password !== undefined) {
      this.cachedToken = await this.createToken();
      this.tokenExpiry = Date.now() + 12 * 60 * 60 * 1000;
      return `Bearer ${this.cachedToken}`;
    }

    return undefined;
  }

  private async createToken(): Promise<string> {
    const username = this.config.username?.trim();
    const password = this.config.password;
    if (!username || password === undefined) {
      throw new Error('Rancher username/password are required to create a token');
    }

    const response = await this.fetchImpl(new URL('/v3-public/localProviders/local?action=login', this.config.baseUrl), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        description: `rancher-mcp-${new Date().toISOString().replace(/[:.]/g, '')}`,
        ttl: 43_200_000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to login to Rancher: ${response.status} ${text}`);
    }

    const payload = await response.json() as { token?: string };
    if (!payload.token) {
      throw new Error('Login response did not contain a token');
    }

    return payload.token;
  }
}
