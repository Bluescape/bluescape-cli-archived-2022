import { AxiosError } from "axios";
import chalk from "chalk";
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

  async getUserId(userId: string): Promise<any> {
    const path = `/users/${userId}`;
    const url = this.getUrlForService(Service.ISAM, path);
    const { data } = await this.request(FetchRequestType.Get, url);
    return data;
  }

  async validateUser(userId: string): Promise<any> {
    try {
      await this.getUserId(userId);
    } catch (error: any) {
      const status = error.response?.status || 500;
      if (status === 400) {
        throw new Error(`Invalid user id`);
      } else if (status === 404) {
        throw new Error(`User not found`);
      }
    }
  }

  async deleteUserById(
    userId: string,
    newOwnerId: string,
    isHardDelete = false
  ): Promise<boolean> {
    const path = `/users/${userId}?newWorkspaceOwnerId=${newOwnerId}&permanent=${isHardDelete}`;
    const url = this.getUrlForService(Service.ISAM, path);
    const { data } = await this.request(FetchRequestType.Delete, url);
    console.log(data);
    return true;
  }

  async getUserFromEmail(email: string, attributes: string[]) {
    const query = `{user(email:"${email}"){${attributes.concat("\n")}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }


  async getUserById(userId: string, attributes: string[]) {
    const query = `{user(userId:"${userId}"){${attributes.concat("\n")}}}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }
  
  async deleteUserViaGL(
    userId: string,
    newWorkspaceOwnerId: string,
    permanentDelete: boolean
  ) {
    const query = `mutation {  deleteUser(    userId:"${userId}"  newWorkspaceOwnerId: "${newWorkspaceOwnerId}"    permanentDelete: ${permanentDelete}  )}`;
    const url = this.getUrlForService(Service.ISAM_GRAPQL);
    const { data } = await this.request(FetchRequestType.Post, url, { query });
    return data;
  }

  async bulkDeleteUser(
    userIds: [string],
    newOwnerId: string,
    isHardDelete = false
  ): Promise<boolean> {
    const path = `/users/bulk_delete?newWorkspaceOwnerId=${newOwnerId}&permanent=${isHardDelete}`;
    const url = this.getUrlForService(Service.PORTAL_API, path);
    const { data } = await this.request(FetchRequestType.Delete, url, {
      user_uids: userIds,
      new_workspace_owner_uid: newOwnerId,
      is_permanent_delete: isHardDelete,
    });

    return true;
  }
}
