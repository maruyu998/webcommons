import express from "express";
import { convertPacket } from "../commons/utils/packet";
import { MdateTz, TIME_ZONES, TimeZone } from "../commons/utils/mdate";
import env from "./env";
import { z } from "zod";
import { InternalServerError } from "./errors";

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
  return (request, response, next) => { Promise.resolve(fn(request, response, next)).catch(next) };
}

function generateLogText(response:express.Response, title:string, message:string){
  const logTexts:string[] = [];
  const date = MdateTz.now(SERVER_TIME_ZONE).format("YYYY/MM/DD_HH:mm:ss");
  logTexts.push(date);
  try{
    const { ip } = response.locals.stats;
    logTexts.push(`${ip}`);
  }catch(e){}
  try{
    const { userId, userName } = response.locals.currentUserInfo;
    logTexts.push(`${userId}:${userName}`);
  }catch(e){}
  logTexts.push(`[${title}]`, message);
  return logTexts.join(" ");
}

export function sendMessage(response:express.Response, title:string, message:string, verbose:boolean=true){
  if(verbose){
    console.info(generateLogText(response, title, message));
  }
  response.json(convertPacket({title, message}));
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sendData(response:express.Response, title:string, message:string, data:any, verbose:boolean=true):void{
  if(verbose){
    console.info(generateLogText(response, title, message));
  }
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
  response.json(convertPacket({title, message, data}));
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sendError(response:express.Response, error:Error, data?:any):void{
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
  const { url, method } = response.locals.stats;
  console.error(generateLogText(response, error.name, error.message), `${[method]}${url}`);
  if(error instanceof InternalServerError){
    error = new InternalServerError("Internal Server Error");
  }
  const title = error.name;
  const message = error.message;
  response.json(convertPacket({title, message, error, data}));
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