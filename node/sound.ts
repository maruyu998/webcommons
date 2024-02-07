import { execSync, exec } from "child_process";
import { roundDecimalText } from "maruyu-webcommons/commons/utils/number";

export function playSoundFile(filepath:string, volume:number, wait:boolean=false){
  const volumeText = roundDecimalText(volume, -2);
  const command = `play --volume ${volumeText} "${filepath}" -q`;
  console.log(`executing > ${command}`);
  if(wait) execSync(command);
  else exec(command);
}

export function playText(text:string, volume:number, speed:number=1.0, wait:boolean=false){
  const jdicPath = `/var/lib/mecab/dic/open-jtalk/naist-jdic`;
  const voicePath = `/usr/share/hts-voice/mei/mei_normal.htsvoice`;
  const volumeText = roundDecimalText(volume, -2);
  const speedText = roundDecimalText(speed, -2);
  const command = `echo "${text}" | open_jtalk -x ${jdicPath} -m "${voicePath}" -r ${speedText} -ow /dev/stdout | play --volume ${volumeText} - -q`;
  console.log(`executing > ${command}`);
  if(wait) execSync(command);
  else exec(command);
}