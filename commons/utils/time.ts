export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export async function sleep(second:number){
  return new Promise(resolve=>setTimeout(resolve, second*1000));
}

export async function wait(func:(...args:any)=>boolean, interval:number){
  await new Promise<void>((resolve,reject)=>{
    const intervalId = setInterval(()=>{
      if(func()===false) return;
      clearInterval(intervalId);
      resolve()
    }, interval)
  })
}