export enum CustomLinkResourceType {
  Blocked = 'Blocked',
  Meet = 'Meet',
}
export type CreateCustomLinkProps = {
  name: string;
  resourceType: CustomLinkResourceType;
  ownerId: string;
  resourceId: string;
};
