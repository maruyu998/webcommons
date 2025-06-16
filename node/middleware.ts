import express from "express";
import { getIpAddress, sendError } from "./express";
import { InvalidParamError, AuthenticationError, InputFormatError } from "./errors";
import { AccessInfoType, getUserInfo, UserInfoType } from "./oauth";
import { getInfoFromApiKey, PermissionType } from "./apiauth";
import { z } from "zod";
import { deserializePacket } from "../commons/utils/packet";
import { PacketSchema } from "../commons/types/packet";

export async function parseStats(
  request:express.Request,
  response:express.Response,
  next:express.NextFunction
){
  response.locals.stats = {
    ip: getIpAddress(request),
    url: request.originalUrl,
    method: request.method,
  };
  response.locals.query = request.query;
  response.locals.body = request.body;
  next();
}

export async function requireSignin(
  request:express.Request,
  response:express.Response,
  next:express.NextFunction
){
  await getUserInfo(request)
  .then(userInfo=>{
    if(userInfo == null) throw new AuthenticationError("current user info is null");
    response.locals.userInfo = userInfo as UserInfoType;
    next();
  })
  .catch(error=>{
    if(error instanceof AuthenticationError) return response.redirect("/signin");
    sendError(response, new AuthenticationError("Sign in is required"));
  });
}

export function requireApiKey(...requiredPermissionList:PermissionType[]){
  return (request:express.Request, response:express.Response, next:express.NextFunction) => {
    const authHeader = request.headers['authorization'] || null;
    if(authHeader == null) return sendError(response, new AuthenticationError("Authentication header is missing."));

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if(token == null) return sendError(response, new AuthenticationError("Authentication Bearer is detected but token is missing."));

    getInfoFromApiKey(token).then(apiInfo=>{
      if(apiInfo == null) return sendError(response, new AuthenticationError("Authentication Bearer token is invalid"));
      const { userId, permissionList } = apiInfo;
      for(const requiredPermission of requiredPermissionList){
        if(!permissionList.includes(requiredPermission)) return sendError(response, new AuthenticationError("Required permissions are not included in this ApiKey."));
      }
      response.locals.accessInfo = { userId, permissionList } as AccessInfoType;
      next();
    });
  }
}

export function deserializePacketInQuery(request:express.Request, response:express.Response, next:express.NextFunction){
  const { success, error, data: serializedPacket } = PacketSchema.safeParse(JSON.parse(response.locals.query.packet));
  if(!success){
    console.error(error);
    return sendError(response, new InputFormatError("query.packet is not serializedPacket type."))
  }
  response.locals.query = deserializePacket(serializedPacket).data;
  next();
}

export function deserializePacketInBody(request:express.Request, response:express.Response, next:express.NextFunction){
  const { success, error, data: serializedPacket } = PacketSchema.safeParse(response.locals.body);
  if(!success){
    console.error(error);
    return sendError(response, new InputFormatError("body is not serializedPacket type."))
  }
  response.locals.body = deserializePacket(serializedPacket);
  next();
}

export function requireQueryZod<T>(zodSchema:z.ZodType<T, any, any>){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    const { success, error, data } = zodSchema.safeParse(response.locals.query);
    if(!success){
      console.error(error);
      // for (const issue of result.error.errors) {
      //   console.log('Path:', issue.path);          // ['userName'] など
      //   console.log('Message:', issue.message);    // "String must contain at least 5 character(s)" など
      //   console.log('Code:', issue.code);          // 'too_small' や 'invalid_type' など
      // }
      const params = error.errors.map(e => e.path[0]);
      return sendError(response, new InvalidParamError(params.join(','), "invalidType"));
    }
    // response.locals.zodQuery = {...(response.locals.zodQuery || {}), ...data};
    response.locals.query = data;
    next();
  }
}

export function requireBodyZod<T>(zodSchema:z.ZodType<T, any, any>){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    const { success, error, data } = zodSchema.safeParse(response.locals.body);  
    if(!success){
      console.error(error);
      // for (const issue of result.error.errors) {
      //   console.log('Path:', issue.path);          // ['userName'] など
      //   console.log('Message:', issue.message);    // "String must contain at least 5 character(s)" など
      //   console.log('Code:', issue.code);          // 'too_small' や 'invalid_type' など
      // }
      const params = error.errors.map(e => e.path[0]);
      return sendError(response, new InvalidParamError(params.join(','), "invalidType"));
    }
    // response.locals.zodBody = {...(response.locals.zodBody || {}), ...data};
    response.locals.body = data;
    next();
  };
}