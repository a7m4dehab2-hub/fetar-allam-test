export function createSheetsBackend(url){
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))throw Error('Invalid Apps Script /exec URL in js/config.js');
 let client=localStorage.getItem('fetar-demo-client');
 if(!client){client=crypto.randomUUID();localStorage.setItem('fetar-demo-client',client);}
 const course=location.pathname.replace(/\/$/,'').split('/').pop()||'';
 let state={opensAt:Date.now()+120000,latency:0,firstFull:false,rateLimit:false,booked:null,log:[]},groups=[];
 async function api(path,{method='GET'}={}){
  const response=await fetch(url,{method:'POST',redirect:'follow',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({clientId:client,courseId:course,path,method})});
  if(!response.ok)throw Object.assign(Error('Google backend HTTP '+response.status),{status:response.status});
  let payload;try{payload=await response.json();}catch(_){throw Error('Google did not return JSON. Check Web app access is Anyone and URL ends /exec.');}
  if(!payload.ok)throw Object.assign(Error(payload.error||'Backend rejected request'),{code:payload.code,status:payload.status,details:payload.details});
  return payload.data;
 }
 let refreshing=false;
 async function refresh(){
  if(refreshing)return;refreshing=true;
  try{
   const data=await api('/api/courses/'+encodeURIComponent(course));
   const mine=await api('/api/me/bookings');const log=await api('/api/log');
   groups=data.slots;state.opensAt=data.course.opensAtUtc;state.booked=mine.bookings.length?groups.findIndex(g=>g.id===mine.bookings[0].id):null;state.log=log.log;
   return data;
  }finally{refreshing=false;}
 }
 return {api,refresh,slots:()=>groups,snapshot:()=>structuredClone(state),remote:true,settings(){},reset(){throw Error('Run startTest in Apps Script to reset shared bookings.');}};
}
