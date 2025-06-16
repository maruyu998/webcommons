import { Mdate, MdateTz } from "./mdate";
import { PacketDataType, PacketSerializedDataType, PacketSerializedType, PacketType } from "../types/packet";
import { isBoolean, isNumber, isString, isDate, isArray, isObject, isMdate, isMdateTz } from "./types";
import { objectMapAssign } from "./object";

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
  const packetSerialized = { title, message, error: errorSerialized, data: serialize(data)};
  return packetSerialized;
}

export function deserializePacket(packetSerialized:PacketSerializedType):PacketType{
  function deserialize(cdata:PacketSerializedDataType):PacketDataType{
    if(!isObject(cdata)) {
      console.error("packet:", packet);
      throw new Error("packet parcing error");
    }
    if(cdata.type === "string") return String(cdata.data);
    if(cdata.type === "number") return Number(cdata.data);
    if(cdata.type === "boolean") return Boolean(cdata.data);
    if(cdata.type === "date") return new Date(cdata.data as number);
    if(cdata.type === "mdateTz") return MdateTz.fromJson(cdata.data as {cls:string, time:number, tz:number});
    if(cdata.type === "mdate") return Mdate.fromJson(cdata.data as {cls:string, time:number});
    if(cdata.type === "array") return (cdata.data as PacketSerializedDataType[]).map(o=>deserialize(o));
    if(cdata.type === "object") return Object.assign({},
      ...Object.entries(cdata.data as {[key:string]:PacketSerializedDataType}).map(([k,v])=>({[k]:deserialize(v)}))
    ) as {[key:string]:PacketSerializedDataType};
    if(cdata.type === "undefined") return undefined;
    if(cdata.type === "null") return null;
    console.error(cdata, typeof cdata.data);
    throw new Error("not implemented in packet conditions");
  }
  const { title, message } = packetSerialized;
  const packet:PacketType = { title, message };
  if(packetSerialized.data !== undefined) packet.data = deserialize(packetSerialized.data);
  if(packetSerialized.error){
    const error = new Error(packetSerialized.error.message, { cause: packetSerialized.error.cause });
    error.name = packetSerialized.error.name;
    error.stack = packetSerialized.error.stack;
    packet.error = error;
  }
  return packet;
}