import { Mdate, MdateTz } from "./mdate";
import { PacketDataType, PacketSerializedDataType, PacketSerializedType, PacketType } from "../types/packet";
import { isBoolean, isNumber, isString, isDate, isArray, isObject, isMdate, isMdateTz } from "./types";
import { objectMapAssign } from "./object";
import { UnsupportedError } from "../../node/errors";


const VERSION = 2;
export function serializePacket({
  title,
  message,
  error,
  data,
  developMode
}:{
  title: string
  message: string
  error?: Error
  data?: PacketDataType,
  developMode?: boolean
}):PacketSerializedType{
  function serialize(data?:PacketDataType):PacketSerializedDataType{
    if(data === undefined) return { type:"undefined", data:undefined };
    if(data === null) return { type:"null", data: null };
    if(isString(data)) return { type:"string", data};
    if(isNumber(data)) return { type:"number", data };
    if(isBoolean(data)) return { type:"boolean", data };
    if(isDate(data)) return { type:"date", data: data.getTime() };
    if(isMdateTz(data)) return { type:"mdateTz", data: data.toJson() };
    if(isMdate(data)) return { type:"mdate", data: data.toJson() };
    if(isArray(data)) return { type:"array", data: data.map(o=>serialize(o)) };
    if(isObject(data)) return { type:"object",
      data: objectMapAssign(data, ([k,v])=>({[k]:serialize(v as PacketDataType)})) as {[key:string]:PacketSerializedDataType}
    };
    /* eslint-disable-next-line */
    console.error({data}, typeof data);
    throw new Error("not implemented in packet conditions");
  }
  const errorSerialized = error ? {
    name: error.name,
    message: error.message,
    stack: developMode ? error.stack : undefined,
    cause: developMode ? error.cause : undefined
  } : undefined;
  const packetSerialized = { title, message, error: errorSerialized, data: serialize(data), version:VERSION } as PacketSerializedType;
  return packetSerialized;
}

export function deserializePacket(packetSerialized:PacketSerializedType):PacketType{
  function deserialize(serializedData:PacketSerializedDataType):PacketDataType{
    if(!isObject(serializedData)) {
      console.error("packet:", serializedData);
      throw new Error("packet parcing error");
    }
    const { type, data } = serializedData;
    if(type === "string") return String(data);
    if(type === "number") return Number(data);
    if(type === "boolean") return Boolean(data);
    if(type === "date") return new Date(data as number);
    if(type === "mdateTz") return MdateTz.fromJson(data as {cls:string, time:number, tz:number});
    if(type === "mdate") return Mdate.fromJson(data as {cls:string, time:number});
    if(type === "array") return (data as PacketSerializedDataType[]).map(o=>deserialize(o));
    if(type === "object") return Object.assign({},
      ...Object.entries(data as {[key:string]:PacketSerializedDataType}).map(([k,v])=>({[k]:deserialize(v)}))
    ) as {[key:string]:PacketSerializedDataType};
    if(type === "undefined") return undefined;
    if(type === "null") return null;
    console.error(serializedData, typeof data);
    throw new Error("not implemented in packet conditions");
  }
  
  const { title, message } = packetSerialized;
  let { version } = packetSerialized;
  if(version == undefined) version = 1;
  const packet = { title, message, version } as PacketType;
  if(version == 1){
    packet.data = deserialize(packetSerialized["convertedData"]);
  }
  else if(version == 2){
    if(packetSerialized.data !== undefined) packet.data = deserialize(packetSerialized.data);
  }
  else{
    throw new UnsupportedError(`version:${version} is not supported yet.`);
  }
  if(packetSerialized.error){
    const error = new Error(packetSerialized.error.message, { cause: packetSerialized.error.cause });
    error.name = packetSerialized.error.name;
    error.stack = packetSerialized.error.stack;
    packet.error = error;
  }
  return packet;
}