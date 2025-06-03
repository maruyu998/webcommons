import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { useCookies } from "react-cookie";
import { useSearchParams } from "react-router-dom";
import { saveSessionData, getSessionData } from "./sessionData";

export function useCookie(name:string, defaultValue:string|undefined=undefined):[string, (v:string)=>void]{
  const [cookie, setCookie] = useCookies([name]);
  const newCookie = String(cookie[name]);
  const newSetCookie = useMemo(()=>function(v:string){setCookie(name, v);}, [setCookie, name]);
  useEffect(()=>{
    if(newCookie===undefined && defaultValue!==undefined) newSetCookie(defaultValue);
  }, [newCookie, defaultValue, newSetCookie]);
  return [newCookie, newSetCookie];
}

export function useCookieRef(name:string, defaultValue:string|undefined=undefined):[string, (v:string)=>void, MutableRefObject<string>]{
  const [cookie, setCookie] = useCookies([name]);
  const newCookie = String(cookie[name]);
  const ref = useRef<string>(newCookie);
  const newSetCookie = useMemo(()=>function(v:string){setCookie(name, v); ref.current = v;}, [name, ref, setCookie]);
  if(newCookie===undefined && defaultValue!==undefined) newSetCookie(defaultValue);
  return [newCookie, newSetCookie, ref];
}

type CookieEncoder<T> = {(param:T):string};
type CookieDecoder<T> = {(param:string):T};
export function useTypeStateCookie<T>(
  name:string,
  defaultValue:T|undefined=undefined,
  encoder:CookieEncoder<T>,
  decoder:CookieDecoder<T>
):[T, Dispatch<SetStateAction<T>>]{
  const [cookie, setCookie] = useCookies([name]);
  const newCookie = String(cookie[name]);
  if(newCookie===undefined && defaultValue!==undefined) setCookie(name, encoder(defaultValue));
  const [ state, setState ] = useState<T>(decoder(newCookie));
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(()=>{ setCookie(name, encoder(state)); }, [state]);
  return [state, setState];
}


export function useStateRef<T>(defaultValue:T):[T, (v:T)=>void, MutableRefObject<T>]{
  const [value, setter] = useState<T>(defaultValue);
  const ref = useRef<T>(value);
  const newSetter = useMemo(()=>function(v:T){setter(v); ref.current = v;}, [ref, setter]);
  useEffect(()=>{
    ref.current = value;
  }, []);
  return [value, newSetter, ref];
}

type SessionEncoder<T> = {(param:T):any};
type SessionDecoder<T> = {(param:any):T};
export function useStateSession<T>(
  endpoint:string,
  key:string, 
  defaultValue:T,
  encoder?:SessionEncoder<T>,
  decoder?:SessionDecoder<T>,
):[T, Dispatch<SetStateAction<T>>, boolean]{
  const [ isInitialized, setIsInitialized ] = useState<boolean>(false);
  const [ value, setter ] = useState<T>(defaultValue);
  useEffect(()=>{
    getSessionData(endpoint, key)
    .then(value=>{
      if(value === undefined) throw new Error("value is undefined");
      if(value === null) throw new Error("value is null");
      return decoder ? decoder(value) : value;
    })
    .catch(error=>{
      console.error(error);
      return defaultValue;
    })
    .then(value=>{
      setter(value as T);
      setIsInitialized(true);
    });
  }, []);
  useEffect(()=>{
    if(!isInitialized) return;
    saveSessionData(endpoint, key, encoder ? encoder(value) : value)
    .catch(error=>console.error(error));
  }, [value]);
  return [ value, setter, isInitialized ];
}

let pendingUpdates: Record<string, string|undefined> = {};
let updateTimer: NodeJS.Timeout|null = null;
const applyBatchUpdates = (setSearchParams: (params: Record<string, string>) => void) => {
  if(updateTimer) return; // すでにタイマーが動作中ならスキップ
  updateTimer = setTimeout(() => {
    const filteredUpdates: Record<string, string> = Object.entries(pendingUpdates)
      .filter(([_, value]) => value !== undefined) // undefined をフィルタリング
      .reduce((acc, [key, value]) => {
        acc[key] = value as string; // value は string のみ
        return acc;
      }, {} as Record<string, string>);
    const currentParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    const hasDiff = Object.keys(filteredUpdates).some(key => currentParams[key] !== filteredUpdates[key])
                || Object.keys(currentParams).some(key => key in pendingUpdates && pendingUpdates[key] === undefined);
    if(hasDiff) setSearchParams(filteredUpdates);
    pendingUpdates = {};
    updateTimer = null;
  }, 100); // 100ms 待機して一括反映
};
type URLSearchParamEncoder<T> = {(param:T):string|undefined};
type URLSearchParamDecoder<T> = {(param:string):T};
export function useStateUrlSearchParamType<T>(
  name:string,
  defaultValue:T,
  encoder:URLSearchParamEncoder<T>,
  decoder:URLSearchParamDecoder<T>
):[T, Dispatch<SetStateAction<T>>]{
  const [ searchParams, setSearchParams ] = useSearchParams();
  const [ state, setState ] = useState<T>((()=>{
    const value = searchParams.get(name);
    return value != null ? decoder(value) : defaultValue;
  })());

  const batchedSetSearchParams = useCallback(() => {
    applyBatchUpdates(setSearchParams);
  }, [setSearchParams]);

  useEffect(() => {
    const value = encoder(state);
    if (value === undefined) {
      delete pendingUpdates[name];
    } else {
      pendingUpdates[name] = value;
    }
    batchedSetSearchParams();
  }, [state, name, encoder, batchedSetSearchParams]);
  return [state, setState];
}