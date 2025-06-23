import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { generateRandom } from "../../../commons/utils/random";
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
    const deleteAt = new Date(Date.now() + duration);
    const id = generateRandom(10);
    setToastList(prev => [...prev, { id, title, message, variant, deleteAt }]);
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
    setPausedToasts(prev => new Set(prev).add(id));
    // Extend the toast's lifetime when paused
    setToastList(prev => prev.map(toast => 
      toast.id === id 
        ? { ...toast, deleteAt: new Date(Date.now() + 5000) }
        : toast
    ));
  }

  function resumeToast(id: string) {
    setPausedToasts(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    // Reset the toast's lifetime when resumed
    setToastList(prev => prev.map(toast => 
      toast.id === id 
        ? { ...toast, deleteAt: new Date(Date.now() + 3000) } // Shorter time when resumed
        : toast
    ));
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
