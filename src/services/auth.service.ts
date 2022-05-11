import fetch from "node-fetch";
import { getServiceUrl } from "../conf";
import { FetchRequestType, Service } from "../types";
import { FetchService } from "./fetch.service";

export class AuthService extends FetchService {
  constructor() {
    super();
  }

  async login(username: string, password: string): Promise<string> {
    try {
      const path = "/authenticate";
      const url = this.getUrlForService(Service.ISAM, path);
      const response = await this.request(FetchRequestType.Post, url, {
        email: username,
        password,
      });
      const { status, data } = response;
      console.log(status, data);
    //   console.log(await response.json())
    } catch (error) {
      console.log(error);
    }
    return "jao";
  }
}
