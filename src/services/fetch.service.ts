import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getServiceUrl, getUserInfo } from "../conf";
import { FetchRequestType, Service, Url } from "../types";

const requestTypesWithPayload: string[] = [
  FetchRequestType.Put,
  FetchRequestType.Post,
  FetchRequestType.Patch,
];

export class FetchService {
  constructor() {}

  private hasPayload(requestType: FetchRequestType): boolean {
    return requestTypesWithPayload.includes(requestType);
  }

  private async addServiceAuthorizationToAxiosConfig(
    config: AxiosRequestConfig = {}
  ): Promise<AxiosRequestConfig> {
    const accessToken = getUserInfo("token");
    const headers = config.headers || {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    headers["X-Bluescape-Internal"] = 1;
    return {
      ...config,
      headers: { ...headers },
    };
  }
  getUrlForService(service: Service, path = ""): Url {
    const baseUrl = getServiceUrl(service);
    // Ensure path isn't prefixed with a slash
    const normalisedPath = path.charAt(0) === "/" ? path.slice(1) : path;
    return `${baseUrl}/${normalisedPath}`;
  }

  async request<T extends Record<string, unknown>>(
    requestType: FetchRequestType,
    url: Url,
    payload?: Record<string, unknown>,
    initialConfig?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      const config = await this.addServiceAuthorizationToAxiosConfig(
        initialConfig
      );

      // Make the request
      const data = this.hasPayload(requestType) ? payload : null;
      console.log(data);
      const response = await axios({
        method: requestType,
        url,
        data,
        ...config,
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }
}
