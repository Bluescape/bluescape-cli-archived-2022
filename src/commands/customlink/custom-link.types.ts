export enum CustomLinkResourceType {
  Blocked ,
  Meet
}
export type CreateCustomLinkProps = {
  name: string;
  resourceType: CustomLinkResourceType;
  ownerId: string;
};
