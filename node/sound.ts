import { execSync, exec } from "child_process";

export function playSoundFile(filepath:string, volume:number, wait:boolean=false){
  const command = `play --volume ${volume} "${filepath}" -q`;
  console.log(`executing > ${command}`);
  if(wait) execSync(command);
  else exec(command);
}

export function playText(text:string, volume:number, speed:number=1.0, wait:boolean=false){
  const jdic_path = `/var/lib/mecab/dic/open-jtalk/naist-jdic`;
  const voice_path = `/usr/share/hts-voice/mei/mei_normal.htsvoice`;
  const command = `echo "${text}" | open_jtalk -x ${jdic_path} -m "${voice_path}" -r ${speed} -ow /dev/stdout | play --volume ${volume} - -q`;
  console.log(`executing > ${command}`);
  if(wait) execSync(command);
  else exec(command);
}