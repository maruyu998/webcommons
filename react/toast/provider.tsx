import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { generateRandom } from "../../commons/utils/random";
import { ToastType } from "./types";
import ToastDisplay from './display';


type ToastProviderType = {
  addToast: (title:string|null,message:string|null,variant:ToastType["variant"],duration?:number)=>void,
  deleteToast: (id:string)=>void,
  pauseToast: (id:string)=>void,
  resumeToast: (id:string)=>void,
}

const ToastContext = createContext<ToastProviderType|undefined>(undefined);

export function useToast(){
  const context = useContext(ToastContext);
  if(context === undefined) throw new Error("context must be used within a provider");
  return context;
}

export function ToastProvider({children}:{children:React.ReactNode}){
  const [toastList, setToastList] = useState<ToastType[]>([]);
  const [pausedToasts, setPausedToasts] = useState<Set<string>>(new Set());
  const toastListRef = useRef<ToastType[]>([]);
  const pausedToastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    toastListRef.current = toastList;
  }, [toastList]);

  useEffect(() => {
    pausedToastsRef.current = pausedToasts;
  }, [pausedToasts]);

  useEffect(() => {
    const deleteExpiredToasts = () => {
      if(toastListRef.current.length === 0) return;
      const now = Date.now();
      const updatedList = toastListRef.current.filter(({id, deleteAt}) => {
        // Don't auto-delete paused toasts
        if(pausedToastsRef.current.has(id)) return true;
        return deleteAt.getTime() > now;
      });
      if(updatedList.length !== toastListRef.current.length) {
        setToastList(updatedList);
      }
    };
    const intervalId = setInterval(deleteExpiredToasts, 100); // More frequent checking for smoother progress
    return () => clearInterval(intervalId);
  }, []);

  function addToast(title:string|null, message:string|null, variant:ToastType["variant"], duration:number=5000){
    const now = new Date();
    const createdAt = now;
    const deleteAt = new Date(now.getTime() + duration);
    const id = generateRandom(10);
    setToastList(prev => [...prev, { id, title, message, variant, createdAt, deleteAt }]);
  }

  function deleteToast(id:string){
    setToastList(prev => prev.filter(t => t.id !== id));
    setPausedToasts(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }

  function pauseToast(id: string) {
    const now = new Date();
    setPausedToasts(prev => new Set(prev).add(id));
    
    // Reset to full duration when hovering - update both createdAt and deleteAt
    setToastList(prev => prev.map(toast => 
      toast.id === id 
        ? { 
            ...toast, 
            createdAt: now, 
            deleteAt: new Date(now.getTime() + 5000) 
          } // Reset to 5 seconds with new creation time
        : toast
    ));
  }

  function resumeToast(id: string) {
    setPausedToasts(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // Time already reset during pause, just resume countdown
  }

  return (
    <ToastContext.Provider
      value={{
        addToast,
        deleteToast,
        pauseToast,
        resumeToast,
      }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <ToastDisplay 
          toastList={toastList} 
          deleteToast={deleteToast}
          pauseToast={pauseToast}
          resumeToast={resumeToast}
          pausedToasts={pausedToasts}
        />
      </div>
    </ToastContext.Provider>
  )
}
