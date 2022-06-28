import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class ConfigService extends FetchService {
  constructor() {
    super();
  }

  async get(inputUrl?: string): Promise<any> {
    const path = '/';
    const url = inputUrl
      ? inputUrl
      : this.getUrlForService(Service.CONFIG, path);
    const { data } = await this.request(FetchRequestType.Get, url);
    return data;
  }
}
