import { FetchRequestType, Service } from '../types';
import { FetchService } from './fetch.service';

export class AccountService extends FetchService {
  constructor() {
    super();
  }

  async getAccountById(accountId: string): Promise<any> {
    const path = `/accounts/${accountId}`;
    const url = this.getUrlForService(Service.ISAM, path);
    try {
      const data = await this.request(FetchRequestType.Get, url);
      return data;
    } catch (error) {
      return { error };
    }
  }
}
