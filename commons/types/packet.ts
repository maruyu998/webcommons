import Mdate from "../utils/mdate";

type BasicSourceTypes = string|number|boolean|Date|Mdate|null;

export type PacketSourceDataType = BasicSourceTypes
                                  |{[key:string]:PacketSourceDataType}
                                  |{[key:string]:PacketSourceDataType[]}
                                  |PacketSourceDataType[];

type ValueType = string|number|boolean|null|ValueType[]|PacketConvertedData[]|{[key:string]:PacketConvertedData};
export type PacketConvertedData = {
  type: "string"|"number"|"boolean"|"date"|"mdate"|"array"|"object"|"null",
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