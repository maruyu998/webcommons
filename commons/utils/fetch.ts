import { serializePacket, deserializePacket } from "./packet";
import { PacketType, PacketSerializedType, PacketDataType } from "../types/packet";
import { z } from "zod";

export const userAgentExample = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";

async function processFetch<T extends z.ZodRawShape>(
  fetchPromise:Promise<Response>,
  window?:Window&typeof globalThis,
  responseSchema?: z.ZodObject<T>,
):Promise<PacketType|{title:string,message:string,data:z.infer<z.ZodObject<T>>}>{
  return await fetchPromise
    .then(res=>{
      if(window === undefined) return res;
      if(!res.redirected) return res;
      window.location.href = res.url;
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
      throw error;
    })
    .then((packet:PacketSerializedType)=>deserializePacket(packet))
    .then(({title, message, data, error})=>{
      if(error) throw error;
      if(responseSchema == undefined) return { title, message, data };
      const { success, error: zodError, data:zodData } = responseSchema.safeParse(data);
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

interface PacketRequestArgs<
  TQuerySchema extends z.ZodTypeAny = z.ZodUndefined,
  TBodySchema extends z.ZodTypeAny = z.ZodUndefined,
  TResponseSchema extends z.ZodObject<any> = z.ZodObject<any>
>{
  url: URL;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  querySchema?: TQuerySchema;
  bodySchema?: TBodySchema;
  responseSchema?: TResponseSchema;
  queryData?: z.infer<TQuerySchema>;
  bodyData?: z.infer<TBodySchema>;
  window?: Window & typeof globalThis;
  option?: OptionType;
}

interface PacketRequestFormArgs<T extends z.ZodRawShape = z.ZodRawShape>{
  url: URL;
  method?: "POST"|"PUT"|"PATCH"|"DELETE";
  formData: Record<string, string|Blob|File>;
  responseSchema?: z.AnyZodObject;
  window?: Window & typeof globalThis;
  option?: OptionType;
}

function packetRequest<
  TQuerySchema extends z.ZodTypeAny,
  TBodySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodObject<any>
>({
  url,
  method,
  queryData,
  querySchema,
  bodyData,
  bodySchema,
  responseSchema,
  window,
  option = {},
}:PacketRequestArgs<TQuerySchema,TBodySchema,TResponseSchema>){
  if(method == "GET" && (bodyData || bodySchema)) throw Error("GET method cannot have body data or schema.");
  const _url = typeof url === "string" ? new URL(url) : url;
  if(queryData){
    if(querySchema){
      const parsed = querySchema.safeParse(queryData);
      if(!parsed.success) throw parsed.error;
    }
    const queryPacket = serializePacket({ title: "", message: "", data: queryData });
    _url.searchParams.append("packet", JSON.stringify(queryPacket));
  }
  let body: BodyInit | undefined = undefined;
  if(method !== "GET" && bodyData){
    if(bodySchema){
      const parsed = bodySchema.safeParse(bodyData);
      if(!parsed.success) throw parsed.error;
    }
    body = JSON.stringify(serializePacket({ title: "", message: "", data: bodyData }));
  }
  const headers = createHeader(option);
  const fetchPromise = fetch(_url.toString(), { method, headers, body });
  return processFetch(fetchPromise, window, responseSchema);
}

export async function getPacket<
  TQuerySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodObject<any> = z.ZodObject<any>
>(args: Omit<PacketRequestArgs<TQuerySchema,z.ZodUndefined,TResponseSchema>,"method"|"bodyData"|"bodySchema">){
  return await packetRequest({ ...args, method: "GET" });
}
export async function postPacket<
  TQuerySchema extends z.ZodTypeAny,
  TBodySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodObject<any> = z.ZodObject<any>
>(args: Omit<PacketRequestArgs<TQuerySchema, TBodySchema, TResponseSchema>,"method">){
  return await packetRequest({ ...args, method: "POST" });
}
export async function patchPacket<
  TQuerySchema extends z.ZodTypeAny,
  TBodySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodObject<any> = z.ZodObject<any>
>(args: Omit<PacketRequestArgs<TQuerySchema, TBodySchema, TResponseSchema>,"method">){
  return await packetRequest({ ...args, method: "PATCH" });
}
export async function putPacket<
  TQuerySchema extends z.ZodTypeAny,
  TBodySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodObject<any> = z.ZodObject<any>
>(args: Omit<PacketRequestArgs<TQuerySchema, TBodySchema, TResponseSchema>,"method">){
  return await packetRequest({ ...args, method: "PUT" });
}
export async function deletePacket<
  TQuerySchema extends z.ZodTypeAny,
  TBodySchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodObject<any> = z.ZodObject<any>
>(args: Omit<PacketRequestArgs<TQuerySchema, TBodySchema, TResponseSchema>,"method">){
  return await packetRequest({ ...args, method: "DELETE" });
}

function packetFormRequest<T extends z.ZodRawShape>({
  url,
  method,
  formData,
  responseSchema,
  window,
  option = {},
}: PacketRequestFormArgs<T>) {
  const _url = typeof url === "string" ? new URL(url) : url;
  const body = new FormData();
  for(const [key,value] of Object.entries(formData)){
    body.append(key, value);
  }
  const headers = createHeaderForm(option);
  const fetchPromise = fetch(_url.toString(), { method, headers, body });
  return processFetch(fetchPromise, window, responseSchema);
}
export async function postFormPacket<T extends z.ZodRawShape>(
  args: Omit<PacketRequestFormArgs<T>, "method">
){
  return await packetFormRequest({ ...args, method: "POST" });
}
export async function patchFormPacket<T extends z.ZodRawShape>(
  args: Omit<PacketRequestFormArgs<T>, "method">
){
  return await packetFormRequest({ ...args, method: "PATCH" });
}
export async function putFormPacket<T extends z.ZodRawShape>(
  args: Omit<PacketRequestFormArgs<T>, "method">
){
  return await packetFormRequest({ ...args, method: "PUT" });
}
export async function deleteFormPacket<T extends z.ZodRawShape>(
  args: Omit<PacketRequestFormArgs<T>, "method">
){
  return await packetFormRequest({ ...args, method: "DELETE" });
}