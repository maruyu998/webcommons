import Mdate from "./mdate";

export function isString(value:unknown):value is string{
  return (typeof value == "string");
}

export function isNumber(value:unknown):value is number{
  return (typeof value == "number");
}

export function isBoolean(value:unknown):value is boolean{
  return (typeof value == "boolean");
}

export function isDate(value:unknown):value is Date{
  return (value instanceof Date);
}

export function isMdate(value:unknown):value is Mdate{
  return (value instanceof Mdate);
}

export function isArray(value:unknown):value is Array<unknown>{
  return (value instanceof Array);
}

export function isObject(value:unknown):value is object{
  return (typeof value == "object");
}

export function isFunction(value:unknown){
  return (typeof value == "function");
}

// export function isObject(value: unknown):value is object{
//   return (typeof value == "object" || typeof value == "function");
// };
