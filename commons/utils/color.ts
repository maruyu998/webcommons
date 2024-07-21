export function parseColor(colorText:string){
  if(colorText[0] == "#"){
      const [red, green, blue] = [1,3,5].map(i=>colorText.slice(i,i+2)).map(c=>parseInt(c,16));
      return {red, green, blue};
  }else{
      throw Error(`not implemented, colorText[${colorText}]`);
  }
}

export function printColor({red,green,blue}:{red:number, green:number, blue:number}){
  const _red = Math.floor(red).toString(16);
  const _green = Math.floor(green).toString(16);
  const _blue = Math.floor(blue).toString(16);
  return `#${_red}${_green}${_blue}`;
}

export function isBrightColor({red,green,blue}:{red:number,green:number,blue:number}){
  return (red * 0.299 + green * 0.587 + blue * 0.114) <= 186;
}

export function rgbToHsv({red,green,blue}:{red:number, green:number, blue:number}) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;

  const max = Math.max( r, g, b ) ;
  const min = Math.min( r, g, b ) ;
  const diff = max - min ;

  const saturation = max == 0 ? 0 : diff / max ;
  const value = max ;
  switch(min) {
    case max :  return {hue: 0, saturation, value};
    case r:     return {hue: (60 * ((b - g) / diff)) + 180, saturation, value};
    case g:     return {hue: (60 * ((r - b) / diff)) + 300, saturation, value};
    case b:     return {hue: (60 * ((g - r) / diff)) + 60, saturation, value};
  }
  throw Error(`not implemeneted red=${red}, green=${green}, blue=${blue}`);
}
export function hsvToRgb({hue,saturation,value}:{hue:number,saturation:number,value:number}) {
  if (saturation==0) return {red:value*255, green:value*255, blue:value*255 };

  const h = (hue%360)/60;
  const s = saturation ;
  const v = value ;

  const i =  Math.floor(h);
  const f = h - i;
  const v1 = v * (1 - s);
  const v2 = v * (1 - s * f);
  const v3 = v * (1 - s * (1 - f));

  switch(i){
    case 0:
      return {red:v*255, green:v3*255, blue:v1*255};
    case 1:
            return {red:v2*255, green:v*255, blue:v1*255};
    case 2:
            return {red:v1*255, green:v*255, blue:v3*255};
    case 3 :
            return {red:v1*255, green:v2*255, blue:v*255};
    case 4 :
            return {red:v3*255, green:v1*255, blue:v*255};
    case 5 :
            return {red:v*255, green:v1*255, blue:v2*255};
  }
  throw Error(`not implemeneted hue=${hue}, saturation=${saturation}, value=${value}`);
}