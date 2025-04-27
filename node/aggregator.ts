export {}
// import fetch from "node-fetch";
// import mconfig from "./mconfig";

// const AGGREGATOR_URI = mconfig.get("aggregatorUri");
// if(AGGREGATOR_URI === undefined) throw new Error("aggregatorUri is not defined on config.");

// function createHeader(bearer?:string){
//   const header = {
//     "Accept": "application/json",
//     "Content-Type": "application/json"
//   };
//   if(bearer) header["Authorization"] = `Bearer ${bearer}`;
//   return header
// }

// export async function getData(
//   service: string, 
//   datatype: string,
//   userId: string,
//   queries:{key:string, value:string}[]=[],
//   webhooks:string[]=[]
// ):Promise<object>{
//   const url = new URL(`${AGGREGATOR_URI}/${service}/${datatype}`);
//   url.searchParams.append("userId", userId);
//   for(const query of queries) url.searchParams.append(query.key, query.value);
//   if(webhooks.length > 0) url.searchParams.append("webhooks", webhooks.join(","));
//   return await fetch(url.href, { 
//     headers: createHeader() 
//   }).then(res=>res.json() as object);
// }

// export async function postData(
//   service: string, 
//   datatype: string,
//   userId: string,
//   data:object={},
//   webhooks:string[]=[]
// ):Promise<object>{
//   const url = new URL(`${AGGREGATOR_URI}/${service}/${datatype}`);
//   url.searchParams.append("userId", userId);
//   if(webhooks.length > 0) url.searchParams.append("webhooks", webhooks.join(","));
//   return await fetch(url.href, {
//     headers: createHeader(),
//     method:"POST",
//     body: JSON.stringify({data})
//   }).then(res=>res.json() as object);
// }

// export async function updateData(
//   service: string,
//   datatype: string,
//   userId: string,
//   queries:{key:string, value:string}[]=[],
//   data:object={},
//   upsert:boolean=true,
//   webhooks:string[]=[]
// ):Promise<object>{
//   const url = new URL(`${AGGREGATOR_URI}/${service}/${datatype}`);
//   url.searchParams.append("userId", userId);
//   for(const query of queries) url.searchParams.append(query.key, query.value);
//   if(upsert) url.searchParams.append("upsert", "true");
//   if(webhooks.length > 0) url.searchParams.append("webhooks", webhooks.join(","));
//   while(true){
//     try{
//       return await fetch(url.href, {
//         headers: createHeader(),
//         method:"PUT",
//         body: JSON.stringify({data})
//       }).then(res=>res.json() as object);
//     }catch(e){
//       console.error(e);
//       await new Promise(resolve=>setTimeout(resolve, 1000));
//     }
//   }
// }

// export async function deleteData(
//   service: string,
//   datatype: string,
//   userId: string,
//   queries:{key:string, value:string}[]=[],
//   webhooks: string[]=[]
// ){
//   const url = new URL(`${AGGREGATOR_URI}/${service}/${datatype}`);
//   url.searchParams.append("userId", userId);
//   for(const query of queries) url.searchParams.append(query.key, query.value);
//   if(webhooks.length > 0) url.searchParams.append("webhooks", webhooks.join(","));
//   return await fetch(url.href, {
//     headers: createHeader(),
//     method:"DELETE"
//   }).then(res=>res.json() as object);
// }