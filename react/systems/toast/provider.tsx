import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { generateRandom } from "../../../commons/utils/random";

export type ToastType = {
  id: string,
  title: string|null, 
  message: string|null, 
  variant: "info"|"success"|"loading"|"warning"|"error"
  deleteAt: Date
}

type ToastProviderType = {
  addToast: (title:string|null,message:string|null,variant:ToastType["variant"],duration?:number)=>void,
  deleteToast: (id:string)=>void,
  toastList: ToastType[],
}

const ToastContext = createContext<ToastProviderType|undefined>(undefined);

export function useToast(){
  const context = useContext(ToastContext);
  if(context === undefined) throw new Error("context must be used within a provider");
  return context;
}

export function ToastProvider({children}){

  const [ toastList, setToastList ] = useState<ToastType[]>([]);
  const toastListRef = useRef<ToastType[]>([]);
  useEffect(()=>{
    toastListRef.current = toastList;
  }, [toastList])

  useEffect(()=>{
    function deleteExpiredToasts(){
      if(toastListRef.current == null) return;
      if(toastListRef.current.length == 0) return;
      const updatedList = toastListRef.current.filter(({deleteAt})=>deleteAt.getTime() > Date.now());
      if(updatedList.length === toastListRef.current.length) return;
      setToastList(updatedList);
    }
    const intervalId = setInterval(deleteExpiredToasts.bind(toastList), 100);
    return ()=>clearInterval(intervalId);
  }, [])
  function addToast(title:string|null, message:string|null, variant:ToastType["variant"], duration:number=5000){
    const deleteAt = new Date(Date.now() + duration);
    const id = generateRandom(10);
    setToastList([...toastList, { id, title, message, variant, deleteAt }])
  }
  function deleteToast(id:string){
    setToastList(toastList.filter(t=>t.id!=id))
  }

  return (
    <ToastContext.Provider
      value={{
        addToast,
        deleteToast,
        toastList,
      }}
    >{children}</ToastContext.Provider>
  )
}
