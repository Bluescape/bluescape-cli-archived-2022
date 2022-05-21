export enum Service {
  ISAM,
  ISAM_GRAPQL,
  PORTAL_API,
  IDENTITY_API,
  COLLAB,
  CONFIG,
}
export enum FetchRequestType {
  Get = 'get',
  Delete = 'delete',
  Head = 'head',
  Post = 'post',
  Put = 'put',
  Patch = 'patch',
}

export type Email = string;
export type Url = string;