export function generateRandom(length:number):string{
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = chars.charAt(Math.floor(Math.random() * chars.length));
  chars += "0123456789";
  for(let i=0; i<length; i++){
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randRange(a:number, b:number){
  return Math.random() * (b - a) + a;
}