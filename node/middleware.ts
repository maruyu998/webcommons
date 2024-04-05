import express from "express";
import { sendError } from "./express";
import { InvalidParamError, AuthenticationError, UnexpectedError } from "./errors";
import { getUserInfo } from "./oauth";
import { isObject } from "../commons/utils/types";
import { getUserIdByApiKey } from "./apiauth";

export async function requireSignin(
  request:express.Request, 
  response:express.Response, 
  next:express.NextFunction
){
  const authHeader = request.headers['authorization'] || null;
  if(authHeader){
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if(!token) {
      return sendError(response, new AuthenticationError("Authentication Bearer is detected but token is missing"));
    }
    const userId = await getUserIdByApiKey(token);
    if(userId == null){
      return sendError(response, new AuthenticationError("Authentication Bearer token is invalid"));
    }
    response.locals.currentUserInfo = { userId };
    next();
    return;
  }
  await getUserInfo(request)
  .then(currentUserInfo=>{
    if(currentUserInfo == null) throw new Error("current user info is null");
    response.locals.currentUserInfo = currentUserInfo;
    next();
  })
  .catch(error=>{
    if(error instanceof AuthenticationError) return response.redirect("/signin");
    sendError(response, new AuthenticationError("Sign in is required"));
  });
}

export function requireQueryParams(...paramNames:string[]){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    if(response.locals.queries === undefined) response.locals.queries = {};
    if(typeof response.locals.queries != "object") return sendError(response, new UnexpectedError("internal error. queries is not object."));
    if(Array.isArray(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must not be array."));
    if(!isObject(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must be object."));
    for(const paramName of paramNames){
      if(request.query[paramName] === undefined) return sendError(response, new InvalidParamError(paramName));
      response.locals.queries[paramName] = String(request.query[paramName]);
    }
    next();
  };
}

export function requireBodyParams(...paramNames:string[]){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    if(response.locals.bodies === undefined) response.locals.bodies = {};
    if(typeof response.locals.bodies != "object") return sendError(response, new UnexpectedError("internal error. bodies is not object."));
    if(Array.isArray(response.locals.bodies)) return sendError(response, new UnexpectedError("internal error. bodies must not be array."));
    if(!isObject(response.locals.bodies)) return sendError(response, new UnexpectedError("internal error. bodies must be object."));
    if(!isObject(request.body)) return sendError(response, new UnexpectedError("internal error. bodies must be object."));
    for(const paramName of paramNames){
      if(request.body[paramName] === undefined) return sendError(response, new InvalidParamError(paramName));
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      response.locals.bodies[paramName] = request.body[paramName];
    }
    next();
  };
}