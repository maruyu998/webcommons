import { getPacket, patchPacket } from "../commons/utils/fetch";

export async function saveSessionData(endpoint:string, key:string, data:any){
  return patchPacket({url: new URL(endpoint, window.location.href), bodyData:{ key, data }});
}

export async function getSessionData(endpoint:string, key:string){
  return getPacket({url: new URL(`${endpoint}`), queryData: { key }}).then((result: any)=>result?.data);
}