import React from "react";

export default function SmallModal({
  modalExtendClassName,
  children,
  isOpen,
  onClose,
  title,
}:{
  modalExtendClassName?: string,
  children: React.ReactNode
  isOpen: boolean,
  onClose: ()=>void,
  title?: React.ReactNode,
}){
  return (
    <div 
      className={`
        modal fixed flex items-center justify-center z-50 overscroll-contain 
        transition duration-300 ease-in-out transform
        w-full h-full top-0 left-0 max-w-full max-h-full
        ${(isOpen ? "" : " opacity-0 pointer-events-none")}
      `}
      onClick={e=>e.stopPropagation()}
    >
      <div className="modal-overlay w-full h-full bg-gray-600 opacity-50 fixed" onClick={onClose}/>
      <div className={`
        modal-container 
        bg-white z-50 rounded-lg shadow-xl
        max-h-[80vh] max-w-[80%] w-full
        flex flex-col
        ${modalExtendClassName}
      `}>
        {/* Fixed Header with Title and Close Button */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1 mr-4">
            {title && (
              <div className="text-lg font-semibold text-gray-900">
                {title}
              </div>
            )}
          </div>
          <button 
            className="modal-close cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="fill-current text-gray-600 hover:text-gray-800" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
              <path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isOpen && children}
        </div>
      </div>
    </div>
  )
}