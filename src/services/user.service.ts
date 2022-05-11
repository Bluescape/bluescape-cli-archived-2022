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

  async deleteUserById(
    userId: string,
    newOwnerId: string,
    isHardDelete = false
  ): Promise<boolean> {
    const path = `/users/${userId}?newWorkspaceOwnerId=${newOwnerId}&permanent=${isHardDelete}`;
    const url = this.getUrlForService(Service.ISAM, path);
    const { data } = await this.request(FetchRequestType.Delete, url);
    return true;
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
