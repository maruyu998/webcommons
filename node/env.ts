import 'dotenv/config';
import { ZodType, ZodTypeDef, z } from "zod";
import { DAY, HOUR, MINUTE } from '../commons/utils/time';

export const UrlSchema = z.union([
  z.string().startsWith("http://localhost"), 
  z.string().startsWith("https://")
]);

export function parseDuration(input: string): number {
  const match = input.match(/^(\d+)(day|hour|minute|ms)$/);
  if (!match) throw new Error(`Invalid duration: ${input}`);

  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);

  switch (unit) {
    case "day": return amount * DAY;
    case "hour": return amount * HOUR;
    case "minute": return amount * MINUTE;
    case "ms": return amount;
    default: throw new Error(`Unsupported unit: ${unit}`);
  }
}

export function parseObject(input: string):Record<string, string>{
  const obj: Record<string, string> = {};
  const pairs = input.trim().split(/\s+/);
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      obj[key.trim()] = value.trim();
    }
  }
  return obj;
}

export function parseListObject(str: string): Record<string, string>[] {
  return str.split(";")
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .map(parseObject);
}

export function parseList(str: string): string[] {
  return str.split(";")
          .map(item => item.trim())
          .filter(item => item.length > 0);
}

function get<TInput,TOutput>(key:string, schema:ZodType<TOutput,ZodTypeDef,TInput>, defaultValue?:TOutput):TOutput{
  const value = process.env[key];
  if(value === undefined){
    if(defaultValue !== undefined){
      return defaultValue;
    }
    throw new Error(`Missing env var: ${key}`);
  }
  try{
    return schema.parse(value);
  } catch (err) {
    throw new Error(`Invalid env var '${key}': ${(err as Error).message}`);
  }
}

export default { get }