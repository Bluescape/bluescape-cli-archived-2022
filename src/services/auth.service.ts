import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class AuthService extends FetchService {
  constructor() {
    super();
  }
  tokenParser(headers: any): string {
    const cookie = headers['set-cookie'] || [''];
    const [regOutput] = cookie.filter((cookieInfo) =>
      cookieInfo.indexOf('idToken') != -1
    );
    const token = regOutput.match(/^idToken=([^;]*);*/);
    return token.length > 0 ? token[1] : null;
  }

  async login(username: string, password: string): Promise<string> {
    try {
      const path = '/authenticate';
      const url = this.getUrlForService(Service.ISAM, path);
      const response = await this.request(FetchRequestType.Post, url, {
        email: username,
        password,
      });
      const { headers } = response;
      return this.tokenParser(headers);
    } catch (error: any) {
      if (error.isAxiosError) {
        const {
          response: { data },
        } = error;
        if (data) {
          throw new Error(`Login Failed: ${data.message}`);
        }
      }
      throw error;
    }
  }
}
