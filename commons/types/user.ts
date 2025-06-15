import { z } from "zod";

export const UserIdSchema = z.string().brand<"MoauthUserId">();
export type UserIdType = z.infer<typeof UserIdSchema>;
export const UserNameSchema = z.string().brand<"MoauthUserName">();
export type UserNameType = z.infer<typeof UserNameSchema>;