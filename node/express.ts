import express from "express";
import { serializePacket } from "../commons/utils/packet";
import { MdateTz, TIME_ZONES, TimeZone } from "../commons/utils/mdate";
import env from "./env";
import { z } from "zod";
import { CustomError, InternalServerError } from "./errors";
import { AccessInfoType, UserInfoType } from "./types/oauth";

const SERVER_TIME_ZONE = env.get("SERVER_TIME_ZONE", z.enum(Object.keys(TIME_ZONES) as [TimeZone, ...TimeZone[]]));

export async function saveSession(request:express.Request){
  await new Promise<void>((resolve)=>request.session.save(()=>resolve()));
}

export async function regenerateSession(request:express.Request){
  await new Promise<void>((resolve)=>request.session.regenerate(()=>{resolve();}));
}

export async function destroySession(request:express.Request){
  await new Promise<void>((resolve)=>request.session.destroy(()=>{resolve();}));
}

export function asyncHandler(
  fn:(request:express.Request, response:express.Response, next:express.NextFunction)=>Promise<any>
):express.RequestHandler
{
  return (request, response, next) => { 
    Promise.resolve(fn(request, response, next))
    .catch(error=>{
      if(error instanceof Error){
        sendError(response, error);
      }else{
        console.error("Unknown error caught:", error);
        sendError(response, new Error(`Unknown error occurred at ${request.originalUrl}[${request.method}]`));
      }
    }
  ) };
}

function generateLogText(response:express.Response, verboseText:string){
  const logTexts:string[] = [];
  const date = MdateTz.now(SERVER_TIME_ZONE).format("YYYY/MM/DD_HH:mm:ss");
  logTexts.push(date);
  try{
    const { ip } = response.locals.stats;
    logTexts.push(`${ip}`);
  }catch(e){}
  try{
    if(response.locals.userInfo){
      const { userId, userName } = response.locals.userInfo as UserInfoType;
      logTexts.push(`${userId}:${userName}`);
    }else if(response.locals.accessInfo){
      const { userId } = response.locals.accessInfo as AccessInfoType;
      logTexts.push(`${userId}(API)`);
    }
  }catch(e){}
  logTexts.push(verboseText);
  return logTexts.join(" ");
}

export function sendNoContent(response:express.Response, verboseText?:string):void{
  if(verboseText !== undefined){
    console.info(generateLogText(response, verboseText));
  }
  response.status(204).end();
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sendData(response:express.Response, data:any, verboseText?:string):void{
  if(verboseText !== undefined){
    console.info(generateLogText(response, verboseText));
  }
  response.status(200).json(serializePacket({data}));
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sendError(response:express.Response, error:Error, verbose:boolean=true):void{
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
  const { url, method } = response.locals.stats;
  if(verbose) console.error(generateLogText(response, `[${error.name}] ${error.message}`), `[${method}]${url}`);
  if((!(error instanceof CustomError) || error.secret)){
    error = new InternalServerError("Internal Server Error");
  }
  const statusCode = error instanceof CustomError ? error.errorcode : 500;
  response.status(statusCode).json(serializePacket({error}));
}

export function getIpAddress(request:express.Request):string|null{
  if(request.app.get('trust proxy') !== false && request.ip){
    return request.ip;
  }
  const realIp = request.headers["x-real-ip"];
  if(realIp){
    if(Array.isArray(realIp)) return realIp[0];
    if (typeof realIp === "string") return realIp;
  }
  const forwardedFor = request.headers["x-forwarded-for"];
  if(forwardedFor){
    if(Array.isArray(forwardedFor)) return forwardedFor[0];
    if(typeof forwardedFor === "string" && forwardedFor.length > 0){
      return forwardedFor.split(",")[0].trim(); // Original Client
    }
  }
  // request.socket.remoteAddress is proxy address
  // if(request.socket?.remoteAddress){
  //   return request.socket.remoteAddress;
  // }
  return null;
}