import { useState, useRef, useEffect, useMemo } from "react";
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
  key:string, 
  defaultValue:T,
  encoder?:SessionEncoder<T>,
  decoder?:SessionDecoder<T>,
):[T, Dispatch<SetStateAction<T>>, boolean]{
  const [ isInitialized, setIsInitialized ] = useState<boolean>(false);
  const [ value, setter ] = useState<T>(defaultValue);
  useEffect(()=>{
    getSessionData(key)
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
    saveSessionData(key, encoder ? encoder(value) : value)
    .catch(error=>console.error(error));
  }, [value]);
  return [ value, setter, isInitialized ];
}

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
  useEffect(()=>{
    const value = encoder(state);
    if(value == undefined){
      searchParams.delete(name);
      setSearchParams({ ...Object.fromEntries(searchParams.entries()) });
    }else{
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()), 
        [name]: value
      });
    }
  }, [state]);
  return [state, setState];
}