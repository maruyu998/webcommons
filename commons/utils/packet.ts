import { Locale, Mdate, MdateTz } from "./mdate";
import { PacketSourceDataType, PacketConvertedData, Packet, DecomposedPacket } from "../types/packet";
import { isBoolean, isNumber, isString, isDate, isArray, isObject, isMdate, isMdateTz } from "./types";
import { objectMapAssign } from "./object";

export function convertPacket({
  title,
  message,
  error,
  data,
  developMode
}:{
  title: string
  message: string
  error?: Error
  data?: PacketSourceDataType,
  developMode?: boolean
}):Packet{
  function convert(data?:PacketSourceDataType):PacketConvertedData{
    if(data === undefined) return { type:"undefined", data:undefined };
    if(data === null) return { type:"null", data: null };
    if(isString(data)) return { type:"string", data};
    if(isNumber(data)) return { type:"number", data };
    if(isBoolean(data)) return { type:"boolean", data };
    if(isDate(data)) return { type:"date", data: data.getTime() };
    if(isMdateTz(data)) return { type:"mdateTz", data: data.toJson() };
    if(isMdate(data)) return { type:"mdate", data: data.toJson() };
    if(isArray(data)) return { type:"array", data: data.map(o=>convert(o)) };
    if(isObject(data)) return { type:"object",
      data: objectMapAssign(data, ([k,v])=>({[k]:convert(v as PacketSourceDataType)})) as {[key:string]:PacketConvertedData}
    };
    /* eslint-disable-next-line */
    console.error({data}, typeof data);
    throw new Error("not implemented in packet conditions");
  }
  const errorConverted = error ? {
    name: error.name,
    message: error.message,
    stack: developMode ? error.stack : undefined,
    cause: developMode ? error.cause : undefined
  } : undefined;
  return { title, message, error: errorConverted, convertedData: convert(data)};
}

export function deconvertPacket(packet:Packet): DecomposedPacket{
  function deconvert(cdata:PacketConvertedData):PacketSourceDataType{
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
    if(cdata.type === "array") return (cdata.data as PacketConvertedData[]).map(o=>deconvert(o));
    if(cdata.type === "object") return Object.assign({},
      ...Object.entries(cdata.data as {[key:string]:PacketConvertedData}).map(([k,v])=>({[k]:deconvert(v)}))
    ) as {[key:string]:PacketSourceDataType};
    if(cdata.type === "undefined") return undefined;
    if(cdata.type === "null") return null;
    console.error(cdata, typeof cdata.data);
    throw new Error("not implemented in packet conditions");
  }
  const { title, message, error, convertedData } = packet;
  const retObject:DecomposedPacket = { title, message };
  if(convertedData !== undefined) retObject.data = deconvert(convertedData);
  if(error){
    const errorDeconverted = new Error(error.message, { cause: error.cause });
    errorDeconverted.name = error.name;
    errorDeconverted.stack = error.stack;
    retObject.error = errorDeconverted;
  }
  return retObject;
}