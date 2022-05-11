import { FetchRequestType, Service } from "../types";
import { FetchService } from "./fetch.service";

export class UserService extends FetchService {
  constructor() {
    super();
  }

  async getSessionUser(): Promise<any> {
    const path = "/users/me";
    const url = this.getUrlForService(Service.ISAM, path);
    const { data } = await this.request(FetchRequestType.Get, url);
    return data;
  }
}
