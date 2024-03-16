import { DAY, HOUR, MINUTE } from "./time";
import { isNumber } from "./types";

type OneToNine = 1|2|3|4|5|6|7|8|9;
type ZeroToNine = 0|1|2|3|4|5|6|7|8|9;
type YYYY = `19${ZeroToNine}${ZeroToNine}` | `20${ZeroToNine}${ZeroToNine}`;
type MM = `0${OneToNine}` | `1${0|1|2}`;
type DD = `${0}${OneToNine}` | `${1|2}${ZeroToNine}` | `3${0|1}`;
export type YYYYMMDD = `${YYYY}-${MM}-${DD}`;

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

function replace(str:string, regex:RegExp, func:()=>string){
  if(regex.test(str)) str = str.replace(regex, func());
  return str;
}

function zeroFill(num:number, digits:number): string{
  return `${Array(digits).join("0")}${num}`.slice(-digits);
}
function getDayOfWeek(locale:Locale, length:"long"|"medium"|"short", index:number):string{
  return LOCALE_FORMATS[locale]["dayOfWeek"][length][index%7];
}
function getAmpm(locale:Locale, upperOrLower:"upper"|"lower", ampm:0|1){
  return LOCALE_FORMATS[locale]["ampm"][upperOrLower][ampm];
}

export default class Mdate {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  private readonly time: number = 0;
  private tz: number|null = null;
  private locale: Locale|null = null;

  constructor(time?:number, tz?:number|TimeZone|null, locale?:Locale|null){
    this.time = (time!==undefined) ? time : Date.now();
    if(tz !== undefined && tz != null) this.setTz(tz);
    if(locale !== undefined && locale != null) this.setLocale(locale);
  }
  toJson = () => ({ time: this.time, tz: this.tz });
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
  clone = () => new Mdate(this.time, this.tz, this.locale);
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
    if(target === "year") return this.addFullYear(value);
    if(target === "month") return this.addMonth(value);
    if(target === "date") return this.addDate(value);
    if(target === "hour") return this.addHour(value);
    if(target === "minute") return this.addMinute(value);
    if(target === "second") return this.addSecond(value);
    if(target === "millisecond") return this.addMilliSecond(value);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`[not reachable] target error, target: ${target}`);
  }
  set(value:number, target:Unit){
    if(this.tz == null) throw new Error("set timezone.");
    if(target === "year") return this.setFullYear(value);
    if(target === "month") return this.setMonth(value);
    if(target === "date") return this.setDate(value);
    if(target === "hour") return this.setHour(value);
    if(target === "minute") return this.setMinute(value);
    if(target === "second") return this.setSecond(value);
    if(target === "millisecond") return this.setMilliSecond(value);
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

  private getFullYear =     () => this.fakeDate.getUTCFullYear();
  private getMonth =        () => this.fakeDate.getUTCMonth();
  private getDate =         () => this.fakeDate.getUTCDate();
  private getDay =          () => this.fakeDate.getUTCDay();
  private getHours =        () => this.fakeDate.getUTCHours();
  private getMinutes =      () => this.fakeDate.getUTCMinutes();
  private getSeconds =      () => this.fakeDate.getUTCSeconds();
  private getMilliSeconds = () => this.fakeDate.getUTCMilliseconds();

  private getFullYearStr =     () => this.getFullYear().toString();
  private getMonthStr =        () => (this.getMonth() + 1).toString();
  private getDateStr =         () => this.getDate().toString();
  private getDayStr =          () => this.getDay().toString();
  private getHoursStr =        () => this.getHours().toString(); 
  private getHalfHourStr =     () => (this.getHours()%12).toString();
  private getMinutesStr =      () => this.getMinutes().toString();
  private getSecondsStr =      () => this.getSeconds().toString();
  private getMilliSecondsStr = () => this.getMilliSeconds().toString();

  private getZeroMonthStr =        () => zeroFill(this.getMonth() + 1, 2);
  private getZeroDateStr =         () => zeroFill(this.getDate(), 2);
  private getZeroHoursStr =        () => zeroFill(this.getHours(), 2);
  private getZeroHalfHourStr =     () => zeroFill(this.getHours()%12, 2);
  private getZeroMinutesStr =      () => zeroFill(this.getMinutes(), 2);
  private getZeroSecondsStr =      () => zeroFill(this.getSeconds(), 2);
  private getMilliZeroSecondsStr = () => zeroFill(this.getMilliSeconds(), 3);

  private setFakeDate = (time:number) => new Mdate(this.time - (this.fakeDate.getTime() - time), this.tz, this.locale);
  
  private setFullYear =  (year:number) => this.setFakeDate(this.fakeDate.setUTCFullYear(year));
  private setMonth =    (month:number) => this.setFakeDate(this.fakeDate.setUTCMonth(month));
  private setDate =      (date:number) => this.setFakeDate(this.fakeDate.setUTCDate(date));
  private setHour =      (hour:number) => this.setFakeDate(this.fakeDate.setUTCHours(hour));
  private setMinute =  (minute:number) => this.setFakeDate(this.fakeDate.setUTCMinutes(minute));
  private setSecond =  (second:number) => this.setFakeDate(this.fakeDate.setUTCSeconds(second));
  private setMilliSecond = (ms:number) => this.setFakeDate(this.fakeDate.setUTCMilliseconds(ms));

  private addFullYear =  (year:number) => this.setFullYear(this.getFullYear() + year);
  private addMonth =    (month:number) => this.setMonth(this.getMonth() + month);
  private addDate =      (date:number) => this.setDate(this.getDate() + date);
  private addHour =      (hour:number) => this.setHour(this.getHours() + hour);
  private addMinute =  (minute:number) => this.setMinute(this.getMinutes() + minute);
  private addSecond =  (second:number) => this.setSecond(this.getSeconds() + second);
  private addMilliSecond = (ms:number) => this.setMilliSecond(this.getMilliSeconds() + ms);

  private getTzString(colon:boolean){
    if(this.tz == null) throw new Error("set timezone.");
    let tzStr = "";
    tzStr += (this.tz >= 0) ? "+" : "-";
    const tzTmp = Math.abs(this.tz);
    tzStr += zeroFill(Math.floor(tzTmp), 2);
    if(colon) tzStr += ":";
    tzStr += zeroFill((tzTmp - Math.floor(tzTmp)) * 60, 2);
    return tzStr;
  }
  private getDayOfWeek(length:"short"|"medium"|"long"){
    if(this.locale == null) throw new Error("set locale.");
    return getDayOfWeek(this.locale, length, this.getDay());
  }
  private getAmpm(upperOrLower:"upper"|"lower"){
    if(this.locale == null) throw new Error("set locale.");
    return getAmpm(this.locale, upperOrLower, this.getHours() < 12 ? 0 : 1);
  }

  format(format:string, timezone?:TimeZone, locale?:Locale): string{
    let text = format;
    const mdate = this.clone();
    if(timezone) mdate.setTz(timezone);
    if(locale) mdate.setLocale(locale);

    text = replace(text, /(?<!Y)YYYY(?!Y)/, ()=>mdate.getFullYearStr());
    text = replace(text, /(?<!M)MM(?!M)/, ()=>mdate.getZeroMonthStr());
    text = replace(text, /(?<!M)M(?!M)/, ()=>mdate.getMonthStr());
    text = replace(text, /(?<!D)DD(?!D)/, ()=>mdate.getZeroDateStr());
    text = replace(text, /(?<!D)D(?!D)/, ()=>mdate.getDateStr());

    text = replace(text, /(?<!H)HH(?!H)/, ()=>mdate.getZeroHoursStr());
    text = replace(text, /(?<!H)H(?!H)/, ()=>mdate.getHoursStr());
    text = replace(text, /(?<!h)hh(?!h)/, ()=>mdate.getZeroHalfHourStr());
    text = replace(text, /(?<!h)h(?!h)/, ()=>mdate.getHalfHourStr());
    text = replace(text, /(?<!m)mm(?!m)/, ()=>mdate.getZeroMinutesStr());
    text = replace(text, /(?<!m)m(?!m)/, ()=>mdate.getMinutesStr());
    text = replace(text, /(?<!s)ss(?!s)/, ()=>mdate.getZeroSecondsStr());
    text = replace(text, /(?<!s)s(?!s)/, ()=>mdate.getSecondsStr());
    text = replace(text, /(?<!S)SSS(?!S)/, ()=>mdate.getMilliZeroSecondsStr());

    text = replace(text, /(?<!Z)ZZ(?!Z)/, ()=>mdate.getTzString(false));
    text = replace(text, /(?<!Z)Z(?!Z)/, ()=>mdate.getTzString(true));

    text = replace(text, /(?<!A)A(?!A)/, ()=>mdate.getAmpm("upper"));
    text = replace(text, /(?<!a)a(?!a)/, ()=>mdate.getAmpm("lower"));

    text = replace(text, /(?<!d)dddd(?!d)/, ()=>mdate.getDayOfWeek("long"));
    text = replace(text, /(?<!d)ddd(?!d)/, ()=>mdate.getDayOfWeek("medium"));
    text = replace(text, /(?<!d)dd(?!d)/, ()=>mdate.getDayOfWeek("short"));
    // text = replace(text, /(?<!d)d(?!d)/, ()=>mdate.getDayStr()); // 0-6

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
                  .setFullYear(findNumber(text, format, "YYYY"))
                  .setMonth(findNumber(text, format, "MM") - 1)
                  .setDate(findNumber(text, format, "DD"))
                  .setHour(findNumber(text, format, "HH"))
                  .setMinute(findNumber(text, format, "mm"))
                  .setSecond(findNumber(text, format, "ss"))
                  .setMilliSecond(findNumber(text, format, "SSS"));
    return mdate;
  }

  getRatio(unit:Extract<Unit, "date"|"hour"|"minute">){
    if(unit === "date") return (this.time - this.set(0,"hour").set(0,"minute").set(0,"second").set(0,"millisecond").time) / DAY;
    if(unit === "hour") return (this.time - this.set(0,"minute").set(0,"second").set(0,"millisecond").time) / HOUR;
    if(unit === "minute") return (this.time - this.set(0,"second").set(0,"millisecond").time) / MINUTE;
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
    return mdate.set(0,"hour").set(0,"minute").set(0,"second").set(0,"millisecond");
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
}