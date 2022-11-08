import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { deleteUserInfo, getServiceUrl, getUserInfo } from '../conf';
import { FetchRequestType, Service, Url } from '../types';

const requestTypesWithPayload: string[] = [
  FetchRequestType.Put,
  FetchRequestType.Post,
  FetchRequestType.Patch,
];

export class FetchService {
  private hasPayload(requestType: FetchRequestType): boolean {
    return requestTypesWithPayload.includes(requestType);
  }

  private async addServiceAuthorizationToAxiosConfig(
    config: AxiosRequestConfig = {},
  ): Promise<AxiosRequestConfig> {
    const accessToken = getUserInfo('token');
    const headers = config.headers || {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    headers['X-Bluescape-Internal'] = 1;
    headers['Cookie'] = `idToken=${accessToken}`; // Tem[porary for UC-COnnector
    return {
      ...config,
      headers: { ...headers },
    };
  }
  getUrlForService(service: Service, path = ''): Url {
    const baseUrl = getServiceUrl(service);
    // Ensure path isn't prefixed with a slash
    const normalisedPath = path.charAt(0) === '/' ? path.slice(1) : path;
    return `${baseUrl}/${normalisedPath}`;
  }

  async handlingCommonError(error: AxiosError) {
    const status = error.response?.status || 500;
    if (status > 399) {
      if (status === 401) {
        deleteUserInfo();
        throw new Error('Unauthorized. Please login again');
      }
    }
  }

  async request<T extends Record<string, unknown>>(
    requestType: FetchRequestType,
    url: Url,
    payload?: Record<string, unknown>,
    initialConfig?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      const config = await this.addServiceAuthorizationToAxiosConfig(
        initialConfig,
      );

      // Make the request
      const data = this.hasPayload(requestType) ? payload : null;
      const response = await axios({
        method: requestType,
        url,
        data,
        ...config,
      });
      return response;
    } catch (error: any) {
      await this.handlingCommonError(error);
      throw error;
    }
  }
}
