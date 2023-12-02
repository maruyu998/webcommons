export function isSame<T>(s1:Set<T>, s2:Set<T>){
  if (s1.size !== s2.size) return false;
  return [...s1].every(function(v){return s2.has(v);});
}

export function isIn<T>(mother:Set<T>, child:Set<T>){
  if(mother.size < child.size) return false;
  return [...child].every(s=>mother.has(s));
}