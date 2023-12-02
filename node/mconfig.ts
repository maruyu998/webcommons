import config from "config";
import { ConfigError } from "./errors";

function get(key:string):string{
  const value = config.get<string>(key) as string|null;
  if(value == null) throw new ConfigError(`key[${key}] is null.`);
  return value;
}

function getNumber(key:string):number{
  const value = config.get<number>(key) as number|null;
  if(value == null) throw new ConfigError(`key[${key}] is null.`);
  return value;
}

export default {
  get,
  getNumber
};