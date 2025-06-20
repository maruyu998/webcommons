import { z } from "zod";
import { UserIdType } from "../../commons/types/user";

export const PermissionSchema = z.string().brand<"Permission">();
export type PermissionType = z.infer<typeof PermissionSchema>;
export type ApiauthType = {
  apiauthId: string,
  apiKey: string,
  userId: UserIdType,
  permissionList: PermissionType[],
  expiresAt: Date|null,
};