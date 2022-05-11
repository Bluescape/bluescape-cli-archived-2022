export enum Service {
  ISAM,
  PORTAL_API,
  IDENTITY_API,
  COLLAB,
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