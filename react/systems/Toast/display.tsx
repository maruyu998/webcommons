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

export default function ToastDisplay({
  toastList,
  deleteToast,
}:{
  toastList: ToastType[],
  deleteToast: (id:string)=>void;
}){
  const toastVs = {
    info: {
      icon: <RiInformationLine className="text-lg mr-2" />,
      borderColor: 'border-blue-600',
      bgColor: 'bg-blue-600'
    },
    success: {
      icon: <RiCheckboxCircleLine className="text-lg mr-2" />,
      borderColor: 'border-green-600',
      bgColor: 'bg-green-600'
    },
    loading: {
      icon: <RiLoader4Line className="text-lg mr-2 animate-spin" />,
      borderColor: 'border-gray-600',
      bgColor: 'bg-gray-600'
    },
    warning: {
      icon: <RiAlertLine className="text-lg mr-2" />,
      borderColor: 'border-yellow-600',
      bgColor: 'bg-yellow-600'
    },
    error: {
      icon: <RiErrorWarningLine className="text-lg mr-2" />,
      borderColor: 'border-red-600',
      bgColor: 'bg-red-600'
    }
  };

  return (
    <div className="flex flex-col-reverse gap-4 shadow-lg">
      {
        toastList.map(({id, title, message, variant, deleteAt})=>(
          <div
            key={id}
            className={`
              toast-item animate-slide-in-right
              border-l-4
              ${toastVs[variant].bgColor}
              ${toastVs[variant].borderColor}
              text-white text-base p-4 min-w-48 relative
            `}
          >
            <div className="flex items-center">
              {toastVs[variant].icon}
              <div className="toast-content">
                {title && <p className="font-bold">{title}</p>}
                {message && <p>{message}</p>}
              </div>
            </div>
            <button
              className="absolute top-0 right-0 mt-2 mr-2 text-white focus:outline-none"
              onClick={() => deleteToast(id)}
            >
              <RiCloseLine className="text-lg" />
            </button>
          </div>
        ))
      }
    </div>
  )
}