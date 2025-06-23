import { Mdate, MdateTz } from "./mdate";
import { PacketDataType, PacketSerializedDataType, PacketSerializedType, PacketType } from "../types/packet";
import { isBoolean, isNumber, isString, isDate, isArray, isObject, isMdate, isMdateTz } from "./types";
import { objectMapAssign } from "./object";
import { UnsupportedError } from "../../node/errors";


const VERSION = 2;
export function serializePacket({
  error,
  data,
  developMode
}:{
  error?: Error
  data?: PacketDataType,
  developMode?: boolean
}):PacketSerializedType{
  function serialize(data?:PacketDataType):PacketSerializedDataType{
    if(data === null) return { t:"nl", d:null };
    if(isString(data)) return { t:"s", d:data};
    if(isNumber(data)) return { t:"nm", d:data };
    if(isBoolean(data)) return { t:"b", d:data };
    if(isDate(data)) return { t:"d", d:data.getTime() };
    if(isMdateTz(data)) return { t:"mt", d:data.toJson() };
    if(isMdate(data)) return { t:"m", d:data.toJson() };
    if(isArray(data)) return { t:"a", d:data.map(o=>serialize(o)) };
    if(isObject(data)) return { t:"o",
      d: objectMapAssign(data, ([k,v])=>({[k]:serialize(v as PacketDataType)})) as {[key:string]:PacketSerializedDataType}
    };
    /* eslint-disable-next-line */
    console.error({data}, typeof data);
    throw new Error("not implemented in packet conditions");
  }
  const packetSerialized:PacketSerializedType = { 
    v: VERSION,
    e: error !== undefined ? {
      name: error.name,
      message: error.message,
      stack: developMode ? error.stack : undefined,
      cause: developMode ? error.cause : undefined
    } : undefined,
    d: data !== undefined ? serialize(data): undefined,
  };
  return packetSerialized;
}

export function deserializePacket(packetSerialized:PacketSerializedType):PacketType{
  function deserialize(serializedData:PacketSerializedDataType):PacketDataType{
    if(!isObject(serializedData)) {
      console.error("packet:", serializedData);
      throw new Error("packet parcing error");
    }
    const { t: type, d: data } = serializedData;
    if(type === "s") return String(data);
    if(type === "nm") return Number(data);
    if(type === "b") return Boolean(data);
    if(type === "d") return new Date(data as number);
    if(type === "mt") return MdateTz.fromJson(data as {cls:string, time:number, tz:number});
    if(type === "m") return Mdate.fromJson(data as {cls:string, time:number});
    if(type === "a") return (data as PacketSerializedDataType[]).map(o=>deserialize(o));
    if(type === "o") return Object.assign({},
      ...Object.entries(data as {[key:string]:PacketSerializedDataType}).map(([k,v])=>({[k]:deserialize(v)}))
    ) as {[key:string]:PacketSerializedDataType};
    if(type === "nl") return null;
    console.error(serializedData, typeof data);
    throw new Error("not implemented in packet conditions");
  }
  let { v: version, e: error } = packetSerialized;
  const packet = { version } as PacketType;
  if(version == undefined) throw new UnsupportedError("version is not found in packet.");
  if(version == 1) throw new UnsupportedError("version 1 packet is not supported.");
  if(version == 2){
    if(packetSerialized.d !== undefined) packet.data = deserialize(packetSerialized.d);
  }
  else{
    throw new UnsupportedError(`version:${version} is not supported yet.`);
  }
  if(error){
    const _error = new Error(error.message, { cause: error.cause });
    _error.name = error.name;
    _error.stack = error.stack;
    packet.error = _error;
  }
  return packet;
}