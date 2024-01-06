import { deconvertPacket } from "./packet";
import { Packet, DecomposedPacket } from "../types/packet";

export const userAgentExample = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";

async function processFetch(
  fetchPromise:Promise<Response>, 
  windowForRedirect?:Window&typeof globalThis
):Promise<DecomposedPacket>{
  return await fetchPromise
    .then(res=>{
      if(windowForRedirect == undefined) return res;
      if(!res.redirected) return res;
      windowForRedirect.location.href = res.url;
      throw new Error("Redirect");
    })
    .then(res=>res.json())
    .then((packet:Packet)=>deconvertPacket(packet))
    .then(({title, message, data, error})=>{
      if(error) throw error;
      return { title, message, data };
    });
}

type CorsType = "cors"|"no-cors"|"same-origin";
type OptionType = {
  accessToken?: string,
  cors?: CorsType
};

function createHeader(option:OptionType){
  const { accessToken, cors } = option;
  const mode = cors || "same-origin";
  const credential = cors == "cors" ? "include" : "same-origin";
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": accessToken ? `Bearer ${accessToken}` : "", 
    mode, credential
  };
}

export function getPacketWithOwnFetch(
  /* eslint-disable-next-line */
  fetch, 
  url: string, 
  option: OptionType={}
):Promise<DecomposedPacket>{
  /* eslint-disable-next-line */
  return processFetch(fetch(url, {
    method: "GET",
    headers: createHeader(option)
  }) as Promise<Response>);
}

export function getPacket(
  url: string, 
  option: OptionType={},
  windowForRedirect?: Window & typeof globalThis
){
  const fetchPromise = fetch(url, {
    method: "GET",
    headers: createHeader(option)
  });
  return processFetch(fetchPromise, windowForRedirect);
}

export function postPacket(
  url: string, 
  object: object, 
  option: OptionType={},
  windowForRedirect?: Window & typeof globalThis
){
  const fetchPromise = fetch(url, {
    method: "POST",
    headers: createHeader(option),
    body: JSON.stringify(object)
  });
  return processFetch(fetchPromise, windowForRedirect);
}

export function putPacket(
  url: string, 
  object: object, 
  option: OptionType={},
  windowForRedirect?: Window & typeof globalThis
){
  const fetchPromise = fetch(url, {
    method: "PUT",
    headers: createHeader(option),
    body: JSON.stringify(object)
  });
  return processFetch(fetchPromise, windowForRedirect);
}

export function deletePacket(
  url: string, 
  object: object, 
  option: OptionType={},
  windowForRedirect?: Window & typeof globalThis
){
  const fetchPromise = fetch(url, {
    method: "DELETE",
    headers: createHeader(option),
    body: JSON.stringify(object)
  });
  return processFetch(fetchPromise, windowForRedirect);
}