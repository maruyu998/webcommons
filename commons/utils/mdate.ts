import { DAY, HOUR, MINUTE } from "./time";
import { isNumber } from "./types";

// type OneToNine = 1|2|3|4|5|6|7|8|9;
// type ZeroToNine = 0|1|2|3|4|5|6|7|8|9;
// type YYYY = `19${ZeroToNine}${ZeroToNine}` | `20${ZeroToNine}${ZeroToNine}`;
// type MM = `0${OneToNine}` | `1${0|1|2}`;
// type DD = `${0}${OneToNine}` | `${1|2}${ZeroToNine}` | `3${0|1}`;
// export type YYYYMMDD = `${YYYY}-${MM}-${DD}`;
export type YYYYMMDD = string;

export function isYYYYMMDD(str:string){
  if(str.length !== "YYYY-MM-DD".length) return false;
  if(str[4] !== "-" || str[7] !== "-") return false;
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(5, 7));
  const date = Number(str.slice(8, 10));
  if(isNaN(year) || isNaN(month) || isNaN(date)) return false;
  if(year < 1900 || year > 2100) return false;
  if(month <= 0 || month > 12) return false;
  if(date <= 0 || date > 31) return false;
  return true;
}

export const TIME_ZONES = {
  "UTC": 0,
  "Asia/Tokyo": 9
} as const;
type TypeOfTimeZone = typeof TIME_ZONES;
export type TimeZone = keyof TypeOfTimeZone;

export type Unit = "year"|"month"|"date"|"hour"|"minute"|"second"|"millisecond";
export const LOCALE_FORMATS = {
  ja: {
    ampm: {
      upper: ["午前","午後"],
      lower: ["午前","午後"],
    },
    months: {
      long: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
      short: ["1","2","3","4","5","6","7","8","9","10","11","12"]
    },
    dayOfWeek: {
      long: ["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"],
      medium: ["日曜","月曜","火曜","水曜","木曜","金曜","土曜"],
      short: ["日","月","火","水","木","金","土"]
    }
  },
  en: {
    ampm: {
      upper: ["AM","PM"],
      lower: ["am","pm"],
    },
    months: {
      long: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      short: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    },
    dayOfWeek: {
      long: ["Sunday", "Monday", "Tueday", "Wedday", "Thuday", "Friday", "Satday"],
      medium: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      short: ["S", "M", "T", "W", "T", "F", "S"]
    }
  }
} as const;
type TypeOfLocaleFormat = typeof LOCALE_FORMATS;
export type Locale = keyof TypeOfLocaleFormat;

function _replace(str:string, regex:RegExp, func:()=>string){
  if(regex.test(str)) str = str.replace(regex, func());
  return str;
}
function _zeroFill(num:number, digits:number): string{
  return `${Array(digits).join("0")}${num}`.slice(-digits);
}
function _getDayOfWeek(locale:Locale, length:"long"|"medium"|"short", index:number):string{
  return LOCALE_FORMATS[locale]["dayOfWeek"][length][index%7];
}
function _getAmpm(locale:Locale, upperOrLower:"upper"|"lower", ampm:0|1){
  return LOCALE_FORMATS[locale]["ampm"][upperOrLower][ampm];
}
function _getLastDayOfMonth(){

}

export default class Mdate {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  private readonly time: number = 0;
  private tz: number|null = null;
  private locale: Locale|null = null;
  private firstDayOfWeek: number|null = null;

  constructor(time?:number, tz?:number|TimeZone|null, locale?:Locale|null, firstDayOfWeek?:number|null){
    this.time = (time!==undefined) ? time : Date.now();
    if(tz !== undefined && tz != null) this.setTz(tz);
    if(locale !== undefined && locale != null) this.setLocale(locale);
    if(firstDayOfWeek !== undefined) this.setFirstDayOfWeek(firstDayOfWeek);
  }
  toJson = () => ({ time: this.time, tz: this.tz, firstDayOfWeek: this.firstDayOfWeek });
  static fromJson = ({time, tz}:{time:number, tz:number|null}) => new Mdate(time, tz);
  private get fakeDate(){
    const date = this.toDate();
    if(this.tz == null) throw new Error("set timezone.");
    date.setHours(date.getHours()+this.tz);
    return date;
  }
  toDate = () => new Date(this.time);
  toString = () => this.toDate().toString();
  toIsoString = () => this.toDate().toISOString();
  static now = () => new Mdate();
  clone = () => new Mdate(this.time, this.tz, this.locale, this.firstDayOfWeek);
  get unix() { return this.time; }
  
  get(target:Unit, timezone?:TimeZone){
    const mdate = this.clone();
    if(timezone) mdate.setTz(timezone);

    if(mdate.tz == null) throw new Error("set timezone.");
    if(target === "year") return mdate.getFullYear();
    if(target === "month") return mdate.getMonth();
    if(target === "date") return mdate.getDate();
    if(target === "hour") return mdate.getHours();
    if(target === "minute") return mdate.getMinutes();
    if(target === "second") return mdate.getSeconds();
    if(target === "millisecond") return mdate.getMilliSeconds();
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`[not reachable] target error, target: ${target}`);
  }
  addMs = (ms:number) => new Mdate(this.time + ms, this.tz, this.locale);

  add(value:number, target:Unit){
    if(this.tz == null) throw new Error("set timezone.");
    if(target === "year") return this.forkAddFullYear(value);
    if(target === "month") return this.forkAddMonth(value);
    if(target === "date") return this.forkAddDate(value);
    if(target === "hour") return this.forkAddHour(value);
    if(target === "minute") return this.forkAddMinute(value);
    if(target === "second") return this.forkAddSecond(value);
    if(target === "millisecond") return this.forkAddMilliSecond(value);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`[not reachable] target error, target: ${target}`);
  }
  forkSet(value:number, target:Unit|"dayOfWeek"){
    if(this.tz == null) throw new Error("set timezone.");
    if(target === "year") return this.forkSetFullYear(value);
    if(target === "month") return this.forkSetMonth(value);
    if(target === "date") return this.forkSetDate(value);
    if(target === "hour") return this.forkSetHour(value);
    if(target === "minute") return this.forkSetMinute(value);
    if(target === "second") return this.forkSetSecond(value);
    if(target === "millisecond") return this.forkSetMilliSecond(value);

    if(target === "dayOfWeek") return this.forkSetDayOfWeek(value);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`[not reachable] target error, target: ${target}`);
  }
  setTz(tz:number|TimeZone):Mdate{ 
    if(isNumber(tz)) this.tz = tz as number;
    else if(tz in TIME_ZONES) this.tz = TIME_ZONES[tz];
    else throw new Error(`timezone is not proper. :${tz}`);
    return this;
  }
  setLocale(locale:Locale):Mdate{
    if(locale in LOCALE_FORMATS) this.locale = locale;
    else throw new Error(`locale is not proper. :${locale}`);
    return this;
  }
  setFirstDayOfWeek(firstDayOfWeek:number|null):Mdate{
    if(firstDayOfWeek == null) this.firstDayOfWeek = null;
    else if(0 <= firstDayOfWeek && firstDayOfWeek <= 6) this.firstDayOfWeek = firstDayOfWeek;
    else throw new Error(`firstDayOfWeek is not proper. :${firstDayOfWeek}`);
    return this;
  }

  // GET [ year / month / date / hour / minute / second / millisecond ]
  private getFullYear =     () => this.fakeDate.getUTCFullYear();
  private getMonth =        () => this.fakeDate.getUTCMonth();
  private getDate =         () => this.fakeDate.getUTCDate();
  private getHours =        () => this.fakeDate.getUTCHours();
  private getMinutes =      () => this.fakeDate.getUTCMinutes();
  private getSeconds =      () => this.fakeDate.getUTCSeconds();
  private getMilliSeconds = () => this.fakeDate.getUTCMilliseconds();
  
  // GET [ dayOfWeek / dayOfYear / weekOfYear ]
  private getDayOfWeek =    () => this.fakeDate.getUTCDay();
  private getDayOfYear =    () => {
    const startOfYear = this.resetTime().forkSet(1,"date").forkSet(0,"month");
    return Math.floor((this.unix - startOfYear.unix) / DAY) + 1;
  }
  private getWeekOfYear =   () => {
    if(this.firstDayOfWeek == null) return Math.ceil(this.getDayOfYear() / 7);
    const startOfYearDayOfWeek = this.resetTime().forkSet(1,"date").forkSet(0,"month").getDayOfWeek();
    return Math.ceil((this.getDayOfYear() + startOfYearDayOfWeek - this.firstDayOfWeek) / 7)
  }

  // GET str [ year / month / date / hour / minute / second / millisecond ]
  private getFullYearStr =     () => this.getFullYear().toString();
  private getMonthStr =        () => (this.getMonth() + 1).toString();
  private getDateStr =         () => this.getDate().toString();
  private getHoursStr =        () => this.getHours().toString(); 
  private getHalfHourStr =     () => (this.getHours()%12).toString();
  private getMinutesStr =      () => this.getMinutes().toString();
  private getSecondsStr =      () => this.getSeconds().toString();
  private getMilliSecondsStr = () => this.getMilliSeconds().toString();
  
  // GET str [ dayOfYear / weekOfYear ]
  private getDayOfYearStr =   () => this.getDayOfYear().toString();
  private getWeekOfYearStr =   () => this.getWeekOfYear().toString();

  // GET zero str [ month / date / hour / halfHour / minute / second / millisecond ]
  private getZeroMonthStr =        () => _zeroFill(this.getMonth() + 1, 2);
  private getZeroDateStr =         () => _zeroFill(this.getDate(), 2);
  private getZeroHoursStr =        () => _zeroFill(this.getHours(), 2);
  private getZeroHalfHourStr =     () => _zeroFill(this.getHours()%12, 2);
  private getZeroMinutesStr =      () => _zeroFill(this.getMinutes(), 2);
  private getZeroSecondsStr =      () => _zeroFill(this.getSeconds(), 2);
  private getZeroMilliSecondsStr = () => _zeroFill(this.getMilliSeconds(), 3);

  // GET zero str [ dayOfYear / weekOfYear ]
  private getZeroDayOfYearStr =   () => _zeroFill(this.getDayOfYear(), 3);
  private getZeroWeekOfYearStr =   () => _zeroFill(this.getWeekOfYear(), 2);

  // GET formatted [ dayOfWeek ]
  private getDayOfWeekFormatted = (length:"short"|"medium"|"long") => {
    if(this.locale == null) throw new Error("set locale.");
    return _getDayOfWeek(this.locale, length, this.getDayOfWeek());
  }


  private forkSetFakeDate = (time:number) => new Mdate(this.time - (this.fakeDate.getTime() - time), this.tz, this.locale, this.firstDayOfWeek);
  
  // FORK_SET [ year / month / date / hour / minute / second / millisecond ]
  private forkSetFullYear =  (year:number) => this.forkSetFakeDate(this.fakeDate.setUTCFullYear(year));
  private forkSetMonth =    (month:number) => this.forkSetFakeDate(this.fakeDate.setUTCMonth(month));
  private forkSetDate =      (date:number) => this.forkSetFakeDate(this.fakeDate.setUTCDate(date));
  private forkSetHour =      (hour:number) => this.forkSetFakeDate(this.fakeDate.setUTCHours(hour));
  private forkSetMinute =  (minute:number) => this.forkSetFakeDate(this.fakeDate.setUTCMinutes(minute));
  private forkSetSecond =  (second:number) => this.forkSetFakeDate(this.fakeDate.setUTCSeconds(second));
  private forkSetMilliSecond = (ms:number) => this.forkSetFakeDate(this.fakeDate.setUTCMilliseconds(ms));

  // FORK_SET [ dayOfWeek ]
  private forkSetDayOfWeek = (dayOfWeek:number) => {
    if(dayOfWeek < 0 || dayOfWeek >= 7) throw new Error(`dayOfWeek must be in 0-6. dayOfWeek=${dayOfWeek}`);
    const fdow = this.firstDayOfWeek||0;
    const cdow = this.getDayOfWeek();
    let dayDiff = dayOfWeek - cdow;
    if(cdow < fdow && fdow <= dayOfWeek) dayDiff -= 7;
    if(cdow >= fdow && fdow > dayOfWeek) dayDiff -= 7;
    return this.forkAddDate(dayDiff);
  }

  // FORK_ADD [ year / month / date / hour / minute / second / millisecond ]
  private forkAddFullYear =  (year:number) => this.forkSetFullYear(this.getFullYear() + year);
  private forkAddMonth =    (month:number) => this.forkSetMonth(this.getMonth() + month);
  private forkAddDate =      (date:number) => this.forkSetDate(this.getDate() + date);
  private forkAddHour =      (hour:number) => this.forkSetHour(this.getHours() + hour);
  private forkAddMinute =  (minute:number) => this.forkSetMinute(this.getMinutes() + minute);
  private forkAddSecond =  (second:number) => this.forkSetSecond(this.getSeconds() + second);
  private forkAddMilliSecond = (ms:number) => this.forkSetMilliSecond(this.getMilliSeconds() + ms);

  private getTzString(colon:boolean){
    if(this.tz == null) throw new Error("set timezone.");
    let tzStr = "";
    tzStr += (this.tz >= 0) ? "+" : "-";
    const tzTmp = Math.abs(this.tz);
    tzStr += _zeroFill(Math.floor(tzTmp), 2);
    if(colon) tzStr += ":";
    tzStr += _zeroFill((tzTmp - Math.floor(tzTmp)) * 60, 2);
    return tzStr;
  }
  private getAmpm(upperOrLower:"upper"|"lower"){
    if(this.locale == null) throw new Error("set locale.");
    return _getAmpm(this.locale, upperOrLower, this.getHours() < 12 ? 0 : 1);
  }

  format(format:string, timezone?:TimeZone, locale?:Locale): string{
    let text = format;
    const mdate = this.clone();
    if(timezone) mdate.setTz(timezone);
    if(locale) mdate.setLocale(locale);

    text = _replace(text, /(?<!Y)YYYY(?!Y)/, ()=>mdate.getFullYearStr());
    text = _replace(text, /(?<!M)MM(?!M)/, ()=>mdate.getZeroMonthStr());
    text = _replace(text, /(?<!M)M(?!M)/, ()=>mdate.getMonthStr());
    text = _replace(text, /(?<!D)DD(?!D)/, ()=>mdate.getZeroDateStr());
    text = _replace(text, /(?<!D)D(?!D)/, ()=>mdate.getDateStr());

    text = _replace(text, /(?<!H)HH(?!H)/, ()=>mdate.getZeroHoursStr());
    text = _replace(text, /(?<!H)H(?!H)/, ()=>mdate.getHoursStr());
    text = _replace(text, /(?<!h)hh(?!h)/, ()=>mdate.getZeroHalfHourStr());
    text = _replace(text, /(?<!h)h(?!h)/, ()=>mdate.getHalfHourStr());
    text = _replace(text, /(?<!m)mm(?!m)/, ()=>mdate.getZeroMinutesStr());
    text = _replace(text, /(?<!m)m(?!m)/, ()=>mdate.getMinutesStr());
    text = _replace(text, /(?<!s)ss(?!s)/, ()=>mdate.getZeroSecondsStr());
    text = _replace(text, /(?<!s)s(?!s)/, ()=>mdate.getSecondsStr());
    text = _replace(text, /(?<!S)SSS(?!S)/, ()=>mdate.getZeroMilliSecondsStr());

    text = _replace(text, /(?<!W)W(?!W)/, ()=>mdate.getWeekOfYearStr());
    text = _replace(text, /(?<!W)WW(?!W)/, ()=>mdate.getZeroWeekOfYearStr());

    text = _replace(text, /(?<!Z)ZZ(?!Z)/, ()=>mdate.getTzString(false));
    text = _replace(text, /(?<!Z)Z(?!Z)/, ()=>mdate.getTzString(true));

    text = _replace(text, /(?<!A)A(?!A)/, ()=>mdate.getAmpm("upper"));
    text = _replace(text, /(?<!a)a(?!a)/, ()=>mdate.getAmpm("lower"));

    text = _replace(text, /(?<!d)dddd(?!d)/, ()=>mdate.getDayOfWeekFormatted("long"));
    text = _replace(text, /(?<!d)ddd(?!d)/, ()=>mdate.getDayOfWeekFormatted("medium"));
    text = _replace(text, /(?<!d)dd(?!d)/, ()=>mdate.getDayOfWeekFormatted("short"));

    return text;
  }

  static parse(text:string, timezone?:number|TimeZone, format?:string):Mdate{
    if(timezone && format){
      // timezone section in text is ignored
      return this.parseFormat(text, format, timezone);
    }else if(timezone && !format){
      console.error({text, timezone, format});
      throw Error("not implemented!");
    }else if (!timezone && format){
      console.error({text, timezone, format});
      throw Error("not implemented!");
    }else{
      const date = new Date(Date.parse(text));
      return new Mdate(date.getTime());
    }
  }
  static parseFormat(text:string, format:string, timezone:number|TimeZone):Mdate{
    function findNumber(text:string, format:string, partstr:string){
      const index = format.indexOf(partstr);
      return index < 0 ? 0 : Number(text.slice(index, index+partstr.length));
    }
    const mdate = new Mdate(0, timezone)
                  .forkSetFullYear(findNumber(text, format, "YYYY"))
                  .forkSetMonth(findNumber(text, format, "MM") - 1)
                  .forkSetDate(findNumber(text, format, "DD"))
                  .forkSetHour(findNumber(text, format, "HH"))
                  .forkSetMinute(findNumber(text, format, "mm"))
                  .forkSetSecond(findNumber(text, format, "ss"))
                  .forkSetMilliSecond(findNumber(text, format, "SSS"));
    return mdate;
  }

  getRatio(unit:Extract<Unit, "date"|"hour"|"minute">){
    if(unit === "date") return (this.time - this.forkSet(0,"hour").forkSet(0,"minute").forkSet(0,"second").forkSet(0,"millisecond").time) / DAY;
    if(unit === "hour") return (this.time - this.forkSet(0,"minute").forkSet(0,"second").forkSet(0,"millisecond").time) / HOUR;
    if(unit === "minute") return (this.time - this.forkSet(0,"second").forkSet(0,"millisecond").time) / MINUTE;
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`[not reachable] unit error, unit: ${unit}`);
  }

  isBefore = (mdate:Mdate) => this.time < mdate.time;
  isSame = (mdate:Mdate) => this.time === mdate.time;
  isAfter = (mdate:Mdate) => this.time > mdate.time;

  resetTime(timezone?:TimeZone){
    const mdate = this.clone();
    if(timezone) mdate.setTz(timezone);
    if(mdate.tz == null) throw new Error("set timezone.");
    return mdate.forkSet(0,"hour").forkSet(0,"minute").forkSet(0,"second").forkSet(0,"millisecond");
  }
  resetWeek(timezone?:TimeZone){
    const mdate = this.clone();
    if(timezone) mdate.setTz(timezone);
    if(mdate.tz == null) throw new Error("set timezone.");
    return mdate.forkSetDayOfWeek(this.firstDayOfWeek||0);
  }
  
  // getDateString(timezone:string):YYYYMMDD{
  //     return this.format("YYYY-MM-DD",timezone) as YYYYMMDD;
  // }
  isToday(timezone?:TimeZone):boolean{
    const mdate = this.clone();
    if(timezone) mdate.setTz(timezone);
    if(mdate.tz == null) throw new Error("set timezone.");
    return (Mdate.now().setTz(mdate.tz).resetTime().unix === mdate.resetTime().unix);
  }
  static getDiff(a:Mdate, b:Mdate, unit:Unit): number {
    let diff = b.time - a.time;
    if(unit === "millisecond") return diff;
    diff /= 1000;
    if(unit === "second") return diff;
    diff /= 60;
    if(unit === "minute") return diff;
    diff /= 60;
    if(unit === "hour") return diff;
    diff /= 24;
    if(unit === "date") return diff;
    throw Error("not implemented");
  }
  getLastDayOfMonth(){
    return this.forkAddMonth(1).forkSetDate(-1).get("date");
  }
}