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

export function getIpAddress(request:express.Request):string{
  if(request.headers["x-real-ip"]){
    if(Array.isArray(request.headers["x-real-ip"])) return request.headers["x-real-ip"][0];
    return request.headers["x-real-ip"];
  }
  if(request.headers["x-forwarded-for"]){
    if(Array.isArray(request.headers["x-forwarded-for"])) return request.headers["x-forwarded-for"][0];
    return request.headers["x-forwarded-for"];
  }
  if(request.socket?.remoteAddress){
    return request.socket.remoteAddress;
  }
  return "0.0.0.0";
}