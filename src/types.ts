export enum Service {
  ISAM,
  ISAM_GRAPHQL,
  PORTAL_API,
  IDENTITY_API,
  COLLAB,
  CONFIG,
  UC_CONNECTOR_URL,
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
