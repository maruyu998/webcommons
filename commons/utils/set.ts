export function isSame<T>(s1:Set<T>, s2:Set<T>){
  if (s1.size !== s2.size) return false;
  return [...s1].every(function(v){return s2.has(v);});
}

export function isIn<T>(mother:Set<T>, child:Set<T>){
  if(mother.size < child.size) return false;
  return [...child].every(s=>mother.has(s));
}

export function union<T>(s1:Set<T>, s2:Set<T>){
  return new Set([...s1, ...s2]);
}

export function intersection<T>(s1:Set<T>, s2:Set<T>){
  return new Set([...s1].filter(e=>s2.has(e)));
}

export function difference<T>(mother:Set<T>, child:Set<T>){
  return new Set([...mother].filter(x => !child.has(x)));
}