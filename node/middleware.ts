import express from "express";
import { sendError } from "./express";
import { InvalidParamError, AuthenticationError, UnexpectedError } from "./errors";
import { getUserInfo } from "./oauth";
import { isObject } from "../commons/utils/types";
import { getInfoFromApiKey } from "./apiauth";
import { z } from "zod";

export async function requireSignin(
  request:express.Request, 
  response:express.Response, 
  next:express.NextFunction
){
  await getUserInfo(request)
  .then(currentUserInfo=>{
    if(currentUserInfo == null) throw new AuthenticationError("current user info is null");
    response.locals.currentUserInfo = currentUserInfo;
    next();
  })
  .catch(error=>{
    if(error instanceof AuthenticationError) return response.redirect("/signin");
    sendError(response, new AuthenticationError("Sign in is required"));
  });
}

export function requireApiKey(...permissionNames:string[]){
  return (request:express.Request, response:express.Response, next:express.NextFunction) => {
    const authHeader = request.headers['authorization'] || null;
    if(authHeader == null) return sendError(response, new AuthenticationError("Authentication header is missing."));

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if(token == null) return sendError(response, new AuthenticationError("Authentication Bearer is detected but token is missing."));

    getInfoFromApiKey(token).then(apiInfo=>{
      if(apiInfo == null) return sendError(response, new AuthenticationError("Authentication Bearer token is invalid"));
      const { userId, permissionList } = apiInfo;
      for(const permissionName of permissionNames){
        if(!permissionList.includes(permissionName)) return sendError(response, new AuthenticationError("Required permissions are not included in this ApiKey."));
      }
      response.locals.currentUserInfo = { userId, permissionList };
      next();
    });
  }
}

// export function requireQueryParams(...paramNames:string[]){
//   return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
//     if(response.locals.queries === undefined) response.locals.queries = {};
//     if(typeof response.locals.queries != "object") return sendError(response, new UnexpectedError("internal error. queries is not object."));
//     if(Array.isArray(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must not be array."));
//     if(!isObject(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must be object."));
//     for(const paramName of paramNames){
//       if(request.query[paramName] === undefined) return sendError(response, new InvalidParamError(paramName, "missing"));
//       response.locals.queries[paramName] = String(request.query[paramName]);
//     }
//     next();
//   };
// }

// export function requireBodyParams(...paramNames:string[]){
//   return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
//     if(response.locals.bodies === undefined) response.locals.bodies = {};
//     if(typeof response.locals.bodies != "object") return sendError(response, new UnexpectedError("internal error. bodies is not object."));
//     if(Array.isArray(response.locals.bodies)) return sendError(response, new UnexpectedError("internal error. bodies must not be array."));
//     if(!isObject(response.locals.bodies)) return sendError(response, new UnexpectedError("internal error. bodies must be object."));
//     if(!isObject(request.body)) return sendError(response, new UnexpectedError("internal error. bodies must be object."));
//     for(const paramName of paramNames){
//       if(request.body[paramName] === undefined) return sendError(response, new InvalidParamError(paramName, "missing"));
//       /* eslint-disable @typescript-eslint/no-unsafe-assignment */
//       response.locals.bodies[paramName] = request.body[paramName];
//     }
//     next();
//   };
// }

export function requireQueryZod<T extends z.ZodRawShape>(zodSchema:z.ZodObject<T>){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    const result = zodSchema.safeParse(request.query);
    if(!result.success){
      console.error(result.error);
      // for (const issue of result.error.errors) {
      //   console.log('Path:', issue.path);          // ['userName'] など
      //   console.log('Message:', issue.message);    // "String must contain at least 5 character(s)" など
      //   console.log('Code:', issue.code);          // 'too_small' や 'invalid_type' など
      // }
      const params = result.error.errors.map(e => e.path[0]);
      return sendError(response, new InvalidParamError(params.join(','), "invalidType"));
    }
    response.locals.zodQuery = {...(response.locals.zodQuery || {}), ...result.data};
    next();
  }
}

export function requireBodyZod<T extends z.ZodRawShape>(zodSchema:z.ZodObject<T>){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    const result = zodSchema.safeParse(request.body);
    if(!result.success){
      console.error(result.error);
      // for (const issue of result.error.errors) {
      //   console.log('Path:', issue.path);          // ['userName'] など
      //   console.log('Message:', issue.message);    // "String must contain at least 5 character(s)" など
      //   console.log('Code:', issue.code);          // 'too_small' や 'invalid_type' など
      // }
      const params = result.error.errors.map(e => e.path[0]);
      return sendError(response, new InvalidParamError(params.join(','), "invalidType"));
    }
    response.locals.zodBody = {...(response.locals.zodBody || {}), ...result.data};
    next();
  };
}