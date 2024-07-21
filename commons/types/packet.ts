import { Mdate, MdateTz } from "../utils/mdate";

type BasicSourceTypes = string|number|boolean|Date|Mdate|MdateTz|null;

export type PacketSourceDataType = BasicSourceTypes
                                  |{[key:string]:PacketSourceDataType}
                                  |{[key:string]:PacketSourceDataType[]}
                                  |PacketSourceDataType[];

type ValueType = string|number|boolean|null|{cls:string,time:number}|{cls:string,time:number,tz:number}|ValueType[]|PacketConvertedData[]|{[key:string]:PacketConvertedData};
export type PacketConvertedData = {
  type: "string"|"number"|"boolean"|"date"|"mdate"|"mdateTz"|"array"|"object"|"null",
  data: ValueType
};

export type Packet = {
  title: string,
  message: string,
  error?: Error,
  convertedData?: PacketConvertedData
};

export type DecomposedPacket = {
  title: string,
  message: string,
  error?: Error,
  data?: PacketSourceDataType
};