import { z } from "zod";

export type UserIdBrandType = "YmwcUserId";
export const UserIdSchema = z.string().brand<UserIdBrandType>();
export type UserIdType = z.infer<typeof UserIdSchema>;
export type UserNameBrandType = "YmwcUserName";
export const UserNameSchema = z.string().brand<UserNameBrandType>();
export type UserNameType = z.infer<typeof UserNameSchema>;