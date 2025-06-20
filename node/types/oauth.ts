import { UserIdType, UserNameType } from "../../commons/types/user";
import { PermissionType } from "./apiauth";

export type AuthSessionType = { codeVerifier: string, returnTo: string, expiresAt:Date };
export type TokenSessionType = { accessToken:string, tokenType:string, refreshToken:string, scope:string, expiresAt:Date };
export type UserInfoType = {
  userId: UserIdType,
  userName: UserNameType,
  data: object,
  expiresAt: Date
};
export type AccessInfoType = {
  userId: UserIdType,
  permissionList: PermissionType[],
}
export type SessionType = { 
  auths?: { [state:string]: AuthSessionType },
  token?: TokenSessionType,
  userInfo?: UserInfoType,
  accessInfo?: AccessInfoType,
};