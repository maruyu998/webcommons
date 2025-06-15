import React, { useEffect, useRef, useState } from "react";
import { enUS, Locale } from 'date-fns/locale';
import { format, isToday, isBefore, setHours, setMinutes, isAfter } from "date-fns";
import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine } from "@remixicon/react";

export default function DatePicker({
  defaultDate,
  maxDate,
  minDate,
  enableTime=false,
  minuteInterval=1,
  displayFormat="yyyy/MM/dd",
  locale=enUS,
  viewInputClassName="border border-gray-300 rounded-lg p-2 min-w-full cursor-pointer bg-white text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
  enableClear=true,
  onValueChange,
}:{
  defaultDate?: Date,
  maxDate?: Date,
  minDate?: Date,
  enableTime?: boolean,
  minuteInterval?:1|2|5|10|15|20|30,
  displayFormat?: string,
  locale?: Locale,
  viewInputClassName?: string,
  enableClear?: boolean
  onValueChange?: (value:Date|null)=>void,
}){
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date|null>(defaultDate??null);
  const [tempDate, setTempDate] = useState<Date>(defaultDate??today);
  const [currentMonth, setCurrentMonth] = useState<number>(tempDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(tempDate.getFullYear());
  const [tempHours, setTempHours] = useState<number>(tempDate.getHours());
  const [tempMinutes, setTempMinutes] = useState<number>(tempDate.getMinutes());

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [popupStyles, setPopupStyles] = useState<React.CSSProperties>({visibility:"hidden"});
  const inputRef = useRef<HTMLInputElement|null>(null);
  const datepickerRef = useRef<HTMLDivElement|null>(null);
  const popupRef = useRef<HTMLDivElement|null>(null);

  const daysOfWeek = Array.from({length:7}, (_,i)=>format(new Date(1970,0,i+4),"EEEEEE",{locale}));
  function getFormattedMonthYear(){
    return format(new Date(currentYear, currentMonth), "LLLL yyyy", { locale });
  }

  function getDaysInMonth(month:number, year:number){
    return new Date(year, month+1, 0).getDate();
  }

  function handleNextMonth(){
    if(currentMonth === 11){
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    }else{
      setCurrentMonth(currentMonth + 1);
    }
  }
  function handlePrevMonth(){
    if(currentMonth === 0){
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    }else{
      setCurrentMonth(currentMonth - 1);
    }
  }
  function handleNextYear(){
    setCurrentYear(currentYear + 1);
  }
  function handlePrevYear(){
    setCurrentYear(currentYear - 1);
  }

  function handleDateSelect(day: number, monthOffset: number = 0){
    const newDate = new Date(currentYear, currentMonth + monthOffset, day);
    if((minDate&&isBefore(newDate,minDate))||(maxDate&&isAfter(newDate,maxDate))) return;
    setTempDate(newDate);
    if(monthOffset !== 0){
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
    }
  }

  function handleToday(){
    if((minDate&&isBefore(today,minDate))||(maxDate&&isAfter(today,maxDate))) return;
    setTempDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setTempHours(today.getHours());
    setTempMinutes(today.getMinutes());
  }
  function handleApply(){
    let finalDate = setHours(setMinutes(tempDate, tempMinutes), tempHours);
    setSelectedDate(finalDate);
    setIsCalendarOpen(false);
    if(onValueChange) onValueChange(finalDate);
  }
  function handleCancel(){
    setTempDate(defaultDate??today);
    setTempHours(defaultDate?defaultDate.getHours():today.getHours());
    setTempMinutes(defaultDate?defaultDate.getMinutes():today.getMinutes());
    setIsCalendarOpen(false);
  }
  function handleClear() {
    setSelectedDate(null);
    setIsCalendarOpen(false);
    if(onValueChange) onValueChange(null); // 日付のリセット時にnullを返す
  }

  function renderDays(){
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days = new Array<JSX.Element>();

    const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);
    for(let i=firstDayOfMonth-1; i>=0; i--){
      const day = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      const disabled = (minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate));
      days.push(
        <button
          key={`prev-${i}`}
          className={`flex justify-center items-center p-1 m-0 rounded-lg w-6 h-6 text-xs ${disabled ? "text-gray-400" : "text-gray-800 hover:bg-blue-100"}`}
          onClick={() => !disabled && handleDateSelect(day, -1)}
          disabled={disabled}
        >{prevMonthDays-i}</button>
      );
    }

    for(let day=1; day<=daysInMonth; day++){
      const date = new Date(currentYear, currentMonth, day);
      const isTodayDate = isToday(date);
      const disabled = (minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate));
      days.push(
        <button
          key={day}
          className={`
            relative flex justify-center items-center p-1 m-0 rounded-lg w-6 h-6 text-xs ${disabled ? "text-gray-400" : "text-gray-800 hover:bg-blue-100"}
            ${
              tempDate &&
              tempDate.getDate() === day &&
              tempDate.getMonth() === currentMonth
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-blue-100"
            }
          `}
          onClick={() => !disabled && handleDateSelect(day)}
          disabled={disabled}
        ><span className={`${isTodayDate ? "border-b-2 border-blue-500" : ""}`}>{day}</span></button>
      );
    }

    const totalDaysDisplayed = days.length;
    const remainingSlots = 42 - totalDaysDisplayed;
    for(let i=1; i<=remainingSlots; i++){
      const date = new Date(currentYear, currentMonth + 1, i);
      const disabled = (minDate && isBefore(date, minDate)) || (maxDate && isAfter(date, maxDate));
      days.push(
        <button
          key={`next-${i}`}
          className={`flex justify-center items-center p-1 m-0 rounded-lg w-6 h-6 text-xs ${disabled ? "text-gray-400" : "text-gray-800 hover:bg-blue-100"}`}
          onClick={() => !disabled && handleDateSelect(i, 1)}
          disabled={disabled}
        >{i}</button>
      );
    }
    return days;
  };

  function adjustPopupPosition(){

    setTimeout(() => {
      if(!inputRef.current || !popupRef.current || !datepickerRef.current) return;
      const floorRect = datepickerRef.current.getBoundingClientRect();
      const inputRect = inputRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let absLeft = inputRect.left + inputRect.width / 2 - popupRect.width / 2;
      if(absLeft < 0){ absLeft = 10; }
      if(absLeft + popupRect.width > screenWidth){ absLeft = screenWidth - popupRect.width - 10; }

      let relTop = inputRect.bottom + 15;
      if(inputRect.bottom + popupRect.height + 10 > screenHeight){
        relTop = inputRect.top - popupRect.height - 10;
      }
      setPopupStyles({
        top: relTop - inputRect.bottom,
        left: absLeft - floorRect.left,
        visibility: 'visible'
      });
    }, 0);
  }

  useEffect(() => {
    function handleClickOutside(event:MouseEvent){
      if(!datepickerRef.current) return;
      if(datepickerRef.current.contains(event.target as Node)) return;
      setIsCalendarOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return ()=>document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(()=>{ if(isCalendarOpen) adjustPopupPosition() }, [isCalendarOpen]);


  function handleTimeChange(hours:number,minutes:number){
    setTempHours(hours);
    setTempMinutes(minutes);
  }

  const hourRef = useRef<HTMLDivElement|null>(null);
  const minuteRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    const itemHeight = 32;
    if(hourRef.current){
      hourRef.current.scrollTo({ top:tempHours*itemHeight, behavior:'smooth' });
    }
    if(minuteRef.current){
      minuteRef.current.scrollTo({ top:(tempMinutes/minuteInterval)*itemHeight, behavior:'smooth' });
    }
  }, [isCalendarOpen, tempHours, tempMinutes, minuteInterval]);

  return (
    <div className="relative inline-block" ref={datepickerRef}>
      <input type="text" ref={inputRef} className={viewInputClassName} readOnly
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        value={selectedDate ? format(selectedDate, displayFormat, { locale }) : "Select"}
      />
      {isCalendarOpen && (
        <div ref={popupRef} style={popupStyles} className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-fit">
          <div className="flex h-60">
            <div className="w-72 h-full">
              <div className="flex justify-between items-center mb-2">
                <button onClick={handlePrevYear} className="text-gray-600 hover:text-blue-500 p-2 rounded-lg transition duration-150"
                ><RiArrowLeftDoubleLine className="inline-block w-5 h-5"/></button>
                <button onClick={handlePrevMonth} className="text-gray-600 hover:text-blue-500 p-2 rounded-lg transition duration-150"
                ><RiArrowLeftSLine className="inline-block w-5 h-5"/></button>
                <span className="text-base font-semibold">{getFormattedMonthYear()}</span>
                <button onClick={handleNextMonth} className="text-gray-600 hover:text-blue-500 p-2 rounded-lg transition duration-150"
                ><RiArrowRightSLine className="inline-block w-5 h-5"/></button>
                <button onClick={handleNextYear} className="text-gray-600 hover:text-blue-500 p-2 rounded-lg transition duration-150"
                ><RiArrowRightDoubleLine className="inline-block w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-7 place-items-center gap-1 mb-2">
                {daysOfWeek.map((day, idx) => (
                  <div key={idx} className="text-center text-sm font-semibold text-gray-600 w-6 h-6">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 place-items-center gap-1">{renderDays()}</div>
            </div>
            { enableTime &&
              <div className="w-20 h-full pt-12">
                <div className="flex flex-row justify-between items-center ml-4 h-full">
                  <div className="flex flex-col items-center h-full">
                    <label className="text-xs font-semibold mb-2">Hour</label>
                    <div ref={hourRef} className="overflow-y-scroll h-full w-8 border no-scrollbar">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={i} onClick={()=>handleTimeChange(i,tempMinutes)}
                          className={`cursor-pointer p-1 text-center ${tempHours === i ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}
                        ><p className="text-sm">{i<10?`0${i}`:i}</p></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center h-full">
                    <label className="text-xs font-semibold mb-2">Minute</label>
                    <div ref={minuteRef} className="overflow-y-scroll h-full w-8 border no-scrollbar">
                      {Array.from({ length: Math.floor(60 / minuteInterval) }, (_, i) => (
                        <div key={i} onClick={()=>handleTimeChange(tempHours,i*minuteInterval)}
                          className={`cursor-pointer p-1 text-center ${tempMinutes === i*minuteInterval ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}
                        ><p className="text-sm">{i*minuteInterval<10?`0${i*minuteInterval}`:i*minuteInterval}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={handleToday} className="bg-gray-100 hover:bg-gray-300 text-gray-900 rounded-md py-1 px-3 text-xs">Today</button>
            <div className="flex gap-2">
              {enableClear && <button onClick={handleClear} className="bg-gray-100 hover:bg-gray-300 text-gray-900 rounded-md py-1 px-3 text-xs">Clear</button>}
              <button onClick={handleCancel} className="bg-yellow-100 hover:bg-yellow-300 text-yellow-900 rounded-md py-1 px-3 text-xs">Cancel</button>
              <button onClick={handleApply} className="bg-blue-100 hover:bg-blue-300 text-blue-900 rounded-md py-1 px-3 text-xs">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}