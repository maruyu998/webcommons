import * as setUtil from "./set";

export function isSameElms<T>(a1:Array<T>, a2:Array<T>){
  return setUtil.isSame(new Set(a1), new Set(a2));
}

export function isInElms<T>(mother:Array<T>, child:Array<T>){
  return setUtil.isIn(new Set(mother), new Set(child));
}
