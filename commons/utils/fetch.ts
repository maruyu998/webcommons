import { deconvertPacket } from "./packet";
import { Packet, DecomposedPacket } from "../types/packet";
import { z } from "zod";

export const userAgentExample = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";

async function processFetch<T extends z.ZodRawShape>(
  fetchPromise:Promise<Response>,
  windowForRedirect?:Window&typeof globalThis,
  zodSchema?: z.ZodObject<T>,
):Promise<DecomposedPacket|{title:string,message:string,data:T}>{
  return await fetchPromise
    .then(res=>{
      if(windowForRedirect === undefined) return res;
      if(!res.redirected) return res;
      windowForRedirect.location.href = res.url;
      throw new Error("Redirect");
    })
    .then(res=>{
      if(res.status == 200) return res;
      throw new Error(`fetch status is not 200, [${res.status}] ${res.statusText} fetching ${res.url}`)
    })
    .then(res=>res.json())
    .catch(error=>{
      if(error.name == "SyntaxError") {
        console.error("JSON Parse Error", error.message);
        throw new Error(`Response is not JSON`);
      }
    })
    .then((packet:Packet)=>deconvertPacket(packet))
    .then(({title, message, data, error})=>{
      if(error) throw error;
      if(zodSchema == undefined) return { title, message, data };
      const { success, error: zodError, data:zodData } = zodSchema.safeParse(data);
      if(!success){
        console.error(zodError.format());
        throw zodError;
      }
      return { title, message, data: zodData }
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
  const credential = cors === "cors" ? "include" : "same-origin";
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": accessToken ? `Bearer ${accessToken}` : "",
    mode, credential
  };
}

function createHeaderForm(option:OptionType){
  const { accessToken, cors } = option;
  const mode = cors || "same-origin";
  const credential = cors === "cors" ? "include" : "same-origin";
  return {
    "Authorization": accessToken ? `Bearer ${accessToken}` : "",
    mode, credential
  };
}

export function getPacket<T extends z.ZodRawShape>(
  url: string,
  option: OptionType={},
  zodSchema?: z.ZodObject<T>,
  windowForRedirect?: Window & typeof globalThis,
){
  const fetchPromise = fetch(url, {
    method: "GET",
    headers: createHeader(option)
  });
  return processFetch(fetchPromise, windowForRedirect, zodSchema);
}

export function postPacket<T extends z.ZodRawShape>(
  url: string,
  object: object,
  option: OptionType={},
  zodSchema?: z.ZodObject<T>,
  windowForRedirect?: Window & typeof globalThis,
){
  const fetchPromise = fetch(url, {
    method: "POST",
    headers: createHeader(option),
    body: JSON.stringify(object)
  });
  return processFetch(fetchPromise, windowForRedirect, zodSchema);
}

export function postPacketForm(
  url: string,
  object: object,
  option: OptionType={},
  windowForRedirect?: Window & typeof globalThis
){
  const formData = new FormData();
  for(const [key,value] of Object.entries(object)){
    formData.append(key, value);
  }
  const fetchPromise = fetch(url, {
    method: "POST",
    headers: createHeaderForm(option),
    body: formData
  });
  return processFetch(fetchPromise, windowForRedirect);
}

export function putPacket<T extends z.ZodRawShape>(
  url: string,
  object: object,
  option: OptionType={},
  zodSchema?: z.ZodObject<T>,
  windowForRedirect?: Window & typeof globalThis,
){
  const fetchPromise = fetch(url, {
    method: "PUT",
    headers: createHeader(option),
    body: JSON.stringify(object)
  });
  return processFetch(fetchPromise, windowForRedirect, zodSchema);
}

export function deletePacket<T extends z.ZodRawShape>(
  url: string,
  object: object,
  option: OptionType={},
  zodSchema?: z.ZodObject<T>,
  windowForRedirect?: Window & typeof globalThis,
){
  const fetchPromise = fetch(url, {
    method: "DELETE",
    headers: createHeader(option),
    body: JSON.stringify(object)
  });
  return processFetch(fetchPromise, windowForRedirect, zodSchema);
}