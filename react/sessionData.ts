import { getPacket, putPacket } from "../commons/utils/fetch";

export async function saveSessionData(key:string, data:any){
  return putPacket("/api/session", { key, data });
}

export async function getSessionData(key:string){
  return getPacket(`/api/session?key=${key}`).then(({data})=>data);
}