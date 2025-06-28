export function hasKeys(obj: Record<string, unknown>, ...keys: string[]): boolean {
  for(const key of keys){
    if(obj[key] === undefined) return false;
  }
  return true;
}

export function objectAssign(...objs:object[]):object{
  return Object.assign({}, ...objs) as object;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function objectMapAssign(obj:object, func:([k,v]:[k:string,v:any])=>{[k:string]:object}):object{
  return objectAssign(
    ...Object.entries(obj).map(func)
  );
}