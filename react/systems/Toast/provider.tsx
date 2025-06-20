import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { generateRandom } from "../../../commons/utils/random";
import { ToastType } from "./types";
import ToastDisplay from './display';


type ToastProviderType = {
  addToast: (title:string|null,message:string|null,variant:ToastType["variant"],duration?:number)=>void,
  deleteToast: (id:string)=>void,
}

const ToastContext = createContext<ToastProviderType|undefined>(undefined);

export function useToast(){
  const context = useContext(ToastContext);
  if(context === undefined) throw new Error("context must be used within a provider");
  return context;
}

export function ToastProvider({children}:{children:React.ReactNode}){

  const [ toastList, setToastList ] = useState<ToastType[]>([]);
  const toastListRef = useRef<ToastType[]>([]);
  useEffect(()=>{
    toastListRef.current = toastList;
  }, [toastList])

  useEffect(()=>{
    const deleteExpiredToasts = () => {
      if(toastListRef.current.length === 0) return;
      const now = Date.now();
      const updatedList = toastListRef.current.filter(({deleteAt}) => deleteAt.getTime() > now);
      if(updatedList.length !== toastListRef.current.length) {
        setToastList(updatedList);
      }
    };
    const intervalId = setInterval(deleteExpiredToasts, 1000);
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
      }}
    >
      {children}
      <div className="fixed bottom-2 right-2 z-50">
        <ToastDisplay toastList={toastList} deleteToast={deleteToast} />
      </div>
    </ToastContext.Provider>
  )
}
