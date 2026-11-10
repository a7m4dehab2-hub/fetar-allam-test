export function createSimulator({storage,now=()=>Date.now()}){
 const key='fetar-allam-simulator-v1';
 const courseId=()=>globalThis.location?.pathname.replace(/\/$/,'').split('/').pop()||'';
 const names=['الأحد الساعة 12 م','الأحد الساعة 2:30 م','الاثنين الساعة 7 ص','الاثنين الساعة 12 م','الثلاثاء الساعة 9:30 ص','الثلاثاء الساعة 12 م'];
 const defaults=()=>({opensAt:now()+60000,latency:100,firstFull:false,rateLimit:false,booked:null,log:[]});
 let state;try{state=JSON.parse(storage.getItem(key));}catch(_){}if(!state||!Number.isFinite(state.opensAt))state=defaults();
 const save=()=>storage.setItem(key,JSON.stringify(state));save();
 function slots(){return names.map((groupName,i)=>({id:'slt_demo'+i,groupName,capacity:3,taken:state.firstFull&&i===0&&now()>=state.opensAt?3:state.booked===i?1:0,remaining:state.firstFull&&i===0&&now()>=state.opensAt?0:state.booked===i?2:3,state:now()<state.opensAt?'scheduled':'open'}));}
 function failure(code,message,status=409){return Object.assign(Error(message),{code,status,details:{opensAtUtc:state.opensAt,slots:slots()}});}
 function log(index,result){state.log.push({at:now(),group:names[index]||'Unknown',result,relative:now()-state.opensAt});state.log=state.log.slice(-150);save();}
 async function api(path,{method='GET'}={}){
  if(path==='/api/me')return {user:{id:'demo',name:'Demo account',emailVerified:true},serverTime:now()};
  if(path==='/api/me/bookings')return {bookings:state.booked===null?[]:[{courseId:courseId(),id:'slt_demo'+state.booked,groupName:names[state.booked]}],serverTime:now()};
  if(path.startsWith('/api/courses/'))return {course:{id:courseId(),name:'Abdomen • Practice lesson',state:now()<state.opensAt?'scheduled':'open',opensAtUtc:state.opensAt},slots:slots(),serverTime:now()};
  const match=/^\/api\/slots\/slt_demo(\d+)\/reserve$/.exec(path);
  if(!match||method!=='POST')throw failure('NOT_FOUND','Unknown simulator route',404);
  const i=Number(match[1]);if(i>=names.length)throw failure('NOT_FOUND','Group not found',404);
  let response,error;
  if(state.rateLimit){state.rateLimit=false;log(i,'RATE_LIMITED');error=failure('RATE_LIMITED','Simulated rate limit',429);}
  else if(now()<state.opensAt){log(i,'SLOT_NOT_OPEN');error=failure('SLOT_NOT_OPEN','Booking has not opened yet');}
  else if(slots()[i].remaining<=0){log(i,'SLOT_FULL');error=failure('SLOT_FULL','This group is full');}
  else if(state.booked!==null&&state.booked!==i){log(i,'ALREADY_IN_COURSE');error=failure('ALREADY_IN_COURSE','You already have a group in this course');}
  else{const alreadyBooked=state.booked===i;state.booked=i;log(i,alreadyBooked?'ALREADY_BOOKED':'CONFIRMED');response={slots:slots(),message:alreadyBooked?'You already hold this seat.':'Your practice seat is confirmed.',alreadyBooked,serverTime:now()};}
  if(state.latency)await new Promise(resolve=>setTimeout(resolve,state.latency));
  if(error)throw error;return response;
 }
 return {api,slots,snapshot:()=>structuredClone(state),reset(options={}){state={...defaults(),...options,booked:null,log:[]};save();},settings(options){Object.assign(state,options);save();}};
}
