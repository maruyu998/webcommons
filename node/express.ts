import express from "express";
import { convertPacket } from "../commons/utils/packet";

export async function saveSession(request:express.Request){
  await new Promise<void>((resolve)=>request.session.save(()=>resolve()));
}

export async function regenerateSession(request:express.Request){
  await new Promise<void>((resolve)=>request.session.regenerate(()=>{resolve();}));
}

export function sendMessage(response:express.Response, title:string, message:string, verbose:boolean=true){
  if(verbose) console.info(`[${title}]: ${message}`);
  response.json(convertPacket({title, message}));
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sendData(response:express.Response, title:string, message:string, data:any, verbose:boolean=true):void{
  if(verbose) console.info(`[${title}]: ${message}`);
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
  response.json(convertPacket({title, message, data}));
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function sendError(response:express.Response, error:Error, data?:any):void{
  const title = error.name;
  const message = error.message;
  console.error(`[${title}]: ${message}`);
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
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