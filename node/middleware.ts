import express from "express";
import { sendError } from "./express";
import { InvalidParamError, AuthenticationError, UnexpectedError, InternalServerError } from "./errors";
import { getUserInfo } from "./oauth";
import { isArray, isNumber, isObject, isString } from "../commons/utils/types";
import { getInfoFromApiKey } from "./apiauth";
import { isYYYYMMDD } from "../commons/utils/mdate";

const paramTypeList = ["str", "int", "number", "unix", "yyyy-mm-dd"] as const;
type ParamType = typeof paramTypeList[number] | string[];

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

export function requireQueryParams(...paramNames:string[]){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    if(response.locals.queries === undefined) response.locals.queries = {};
    if(typeof response.locals.queries != "object") return sendError(response, new UnexpectedError("internal error. queries is not object."));
    if(Array.isArray(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must not be array."));
    if(!isObject(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must be object."));
    for(const paramName of paramNames){
      if(request.query[paramName] === undefined) return sendError(response, new InvalidParamError(paramName, "missing"));
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
      if(request.body[paramName] === undefined) return sendError(response, new InvalidParamError(paramName, "missing"));
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      response.locals.bodies[paramName] = request.body[paramName];
    }
    next();
  };
}

export function requireQueryParamTypes(
  paramTypeRecord:{
    [name:string]: ParamType | {type:ParamType,nullable?:boolean}
  }
){
  return ( request: express.Request, response: express.Response, next: express.NextFunction ) => {
    if(response.locals.queries === undefined) response.locals.queries = {};
    if(typeof response.locals.queries != "object") return sendError(response, new UnexpectedError("internal error. queries is not object."));
    if(Array.isArray(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must not be array."));
    if(!isObject(response.locals.queries)) return sendError(response, new UnexpectedError("internal error. queries must be object."));
    for(const paramName of Object.keys(paramTypeRecord)){
      const tmp = paramTypeRecord[paramName];
      const requiredType = (typeof tmp == "object" && !Array.isArray(tmp)) ? tmp.type : tmp;
      const nullable = (typeof tmp == "object" && !Array.isArray(tmp)) ? (tmp.nullable??false) : false;

      const value = request.query[paramName];
      if(value === undefined) return sendError(response, new InvalidParamError(paramName, "missing"));

      if(Array.isArray(requiredType)){
        if(!isString(value)) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        if(!requiredType.includes(value)) return sendError(response, new InvalidParamError(paramName, "invalidValue"));
        response.locals.queries[paramName] = value;
      }
      else if(requiredType == "str"){
        if(!isString(value)) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        response.locals.queries[paramName] = value;
      }
      else if(requiredType == "number"){
        const numberValue = Number(value);
        if(Number.isNaN(numberValue)) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        response.locals.queries[paramName] = numberValue;
      }
      else if(requiredType == "int"){
        const numberValue = Number(value);
        if(!Number.isInteger(numberValue)) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        response.locals.queries[paramName] = numberValue;
      }
      else if(requiredType == "unix"){
        if(!paramName.endsWith("Unix")) return sendError(response, new InternalServerError("Query parameter of type 'unix' must have a name that ends with 'Unix'."));
        const numberValue = Number(value);
        if(!Number.isInteger(numberValue)) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        if(numberValue < 0) return sendError(response, new InvalidParamError(paramName, "invalidValue"));
        const dateValue = new Date(numberValue);
        if(Number.isNaN(dateValue.getTime())) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        const newParamName = paramName.replace(/Unix$/, 'Date');
        response.locals.queries[paramName] = numberValue;
        response.locals.queries[newParamName] = dateValue;
      }
      else if(requiredType == "yyyy-mm-dd"){
        if(!(paramName.endsWith("DateString")||paramName.endsWith("dateString"))) return sendError(response, new InternalServerError("Query parameter of type 'yyyy-mm-dd' must have a name that ends with '[D|d]ateString'."));
        if(!isString(value)) return sendError(response, new InvalidParamError(paramName, "invalidType"));
        if(!isYYYYMMDD(value)) return sendError(response, new InvalidParamError(paramName, "invalidValue"));
        response.locals.queries[paramName] = value;
      }
      else{
        return sendError(response, new UnexpectedError("internal error. reached else block."));
      }
    }
    next();
  };
}