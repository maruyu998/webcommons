import React, { useEffect, useRef, useState } from "react";
import {
  RiInformationLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiAlertLine,
  RiErrorWarningLine,
  RiCloseLine
} from "@remixicon/react";
import { ToastType } from "./types";

interface ToastDisplayProps {
  toastList: ToastType[];
  deleteToast: (id: string) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
  pausedToasts: Set<string>;
}

interface ToastAnimationState {
  [key: string]: 'entering' | 'entered' | 'exiting';
}

export default function ToastDisplay({ toastList, deleteToast, pauseToast, resumeToast, pausedToasts }: ToastDisplayProps) {
  const [animationStates, setAnimationStates] = useState<ToastAnimationState>({});
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const toastVariants = {
    info: {
      icon: <RiInformationLine className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-800',
      closeColor: 'text-blue-400 hover:text-blue-600'
    },
    success: {
      icon: <RiCheckboxCircleLine className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-800',
      closeColor: 'text-green-400 hover:text-green-600'
    },
    loading: {
      icon: <RiLoader4Line className="w-5 h-5 animate-spin" />,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconColor: 'text-slate-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-800',
      closeColor: 'text-slate-400 hover:text-slate-600'
    },
    warning: {
      icon: <RiAlertLine className="w-5 h-5" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      messageColor: 'text-amber-800',
      closeColor: 'text-amber-400 hover:text-amber-600'
    },
    error: {
      icon: <RiErrorWarningLine className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-800',
      closeColor: 'text-red-400 hover:text-red-600'
    }
  };

  useEffect(() => {
    toastList.forEach(toast => {
      if (!animationStates[toast.id]) {
        setAnimationStates(prev => ({ ...prev, [toast.id]: 'entering' }));
        
        const enterTimeout = setTimeout(() => {
          setAnimationStates(prev => ({ ...prev, [toast.id]: 'entered' }));
        }, 50);
        
        timeoutRefs.current[toast.id] = enterTimeout;
      }
    });
    
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, [toastList, animationStates]);

  const handleDelete = (id: string) => {
    setAnimationStates(prev => ({ ...prev, [id]: 'exiting' }));
    
    const exitTimeout = setTimeout(() => {
      deleteToast(id);
      setAnimationStates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      delete timeoutRefs.current[id];
    }, 200);
    
    timeoutRefs.current[id] = exitTimeout;
  };

  const getAnimationClass = (id: string) => {
    const state = animationStates[id] || 'entering';
    switch (state) {
      case 'entering':
        return 'opacity-0 translate-x-full scale-95';
      case 'entered':
        return 'opacity-100 translate-x-0 scale-100';
      case 'exiting':
        return 'opacity-0 translate-x-full scale-95';
      default:
        return 'opacity-0 translate-x-full scale-95';
    }
  };

  return (
    <div className="flex flex-col-reverse gap-3 max-w-sm w-full">
      {toastList.map(({ id, title, message, variant, deleteAt }) => {
        const variantStyles = toastVariants[variant];
        const isPaused = pausedToasts.has(id);
        const remainingTime = isPaused ? 5000 : Math.max(0, deleteAt.getTime() - Date.now());
        const totalDuration = 5000; // Default duration
        const progressPercentage = isPaused ? 100 : Math.max(0, (remainingTime / totalDuration) * 100);
        
        return (
          <div
            key={id}
            className={`
              transform transition-all duration-200 ease-out
              ${getAnimationClass(id)}
              ${variantStyles.bgColor}
              ${variantStyles.borderColor}
              border rounded-lg shadow-lg backdrop-blur-sm
              p-4 min-w-72 relative overflow-hidden
              hover:shadow-xl cursor-pointer
              ${isPaused ? 'ring-2 ring-offset-1 ring-current' : ''}
            `}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            onMouseEnter={() => pauseToast(id)}
            onMouseLeave={() => resumeToast(id)}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${variantStyles.iconColor}`}>
                {variantStyles.icon}
              </div>
              <div className="flex-1 min-w-0">
                {title && (
                  <h4 className={`font-semibold text-sm ${variantStyles.titleColor} mb-1`}>
                    {title}
                  </h4>
                )}
                {message && (
                  <p className={`text-sm ${variantStyles.messageColor} leading-relaxed`}>
                    {message}
                  </p>
                )}
              </div>
              <button
                className={`
                  flex-shrink-0 p-1 rounded-full transition-colors duration-150
                  ${variantStyles.closeColor}
                  hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1
                  focus:ring-current
                `}
                onClick={() => handleDelete(id)}
                aria-label="Close notification"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
              <div 
                className={`h-full transition-all ease-linear ${variantStyles.iconColor.replace('text-', 'bg-')} ${isPaused ? 'animate-pulse' : ''}`}
                style={{
                  width: `${progressPercentage}%`,
                  transition: isPaused ? 'none' : (remainingTime > 0 ? `width ${remainingTime}ms linear` : 'none')
                }}
              />
            </div>
            
            {/* Pause indicator */}
            {isPaused && (
              <div className="absolute top-2 left-2 text-xs opacity-75 bg-black/20 px-2 py-1 rounded">
                Paused
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}