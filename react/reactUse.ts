import { useState, useRef, useEffect } from "react";
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { useCookies } from "react-cookie";

export function useCookie(name:string, defaultValue:string|undefined=undefined):[string, (v:string)=>void]{
    const [cookie, setCookie] = useCookies([name]);
    const newCookie = String(cookie[name]);
    const newSetCookie = (v:string) => setCookie(name, v);
    if(newCookie===undefined && defaultValue!==undefined) newSetCookie(defaultValue);
    return [newCookie, newSetCookie];
}

export function useCookieRef(name:string, defaultValue:string|undefined=undefined):[string, (v:string)=>void, MutableRefObject<string>]{
    const [cookie, setCookie] = useCookies([name]);
    const newCookie = String(cookie[name]);
    const ref = useRef<string>(newCookie);
    const newSetCookie = (v:string) => {setCookie(name, v); ref.current = v;};
    if(newCookie===undefined && defaultValue!==undefined) newSetCookie(defaultValue);
    return [newCookie, newSetCookie, ref];
}

type Encoder<T> = {(param:T):string};
type Decoder<T> = {(param:string):T};
export function useTypeStateCookie<T>(
    name:string,
    encoder:Encoder<T>,
    decoder:Decoder<T>,
    defaultValue:T|undefined=undefined
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
    const newSetter = (v:T) => {setter(v); ref.current = v;};
    ref.current = value;
    return [value, newSetter, ref];
}