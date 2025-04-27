import { getPacket, putPacket } from "../commons/utils/fetch";

export async function saveSessionData(endpoint:string, key:string, data:any){
  return putPacket(endpoint, { key, data });
}

export async function getSessionData(endpoint:string, key:string){
  return getPacket(`${endpoint}?key=${key}`).then(({data})=>data);
}