import { execSync, exec } from "child_process";
import { roundDecimalText } from "../commons/utils/number";
import env from "./env";
import { z } from "zod";

export function playSoundFile(filepath:string, volume:number, wait:boolean=false){
  const volumeText = roundDecimalText(volume, -2);
  const command = `play --volume ${volumeText} "${filepath}" -q`;
  console.log(`executing > ${command}`);
  if(wait) execSync(command);
  else exec(command);
}

export function playText(text:string, volume:number, speed:number=1.0, wait:boolean=false){
  const jdicPath = env.get("SOUND_JDIC_PATH", z.string().nonempty());
  const voicePath = env.get("SOUND_VOICE_PATH", z.string().nonempty());
  const volumeText = roundDecimalText(volume, -2);
  const speedText = roundDecimalText(speed, -2);
  const command = `echo "${text}" | open_jtalk -x ${jdicPath} -m "${voicePath}" -r ${speedText} -ow /dev/stdout | play --volume ${volumeText} - -q`;
  console.log(`executing > ${command}`);
  if(wait) execSync(command);
  else exec(command);
}