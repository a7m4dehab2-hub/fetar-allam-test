import {api,simulator,serverNow,syncClock} from './common.js';
const $=id=>document.getElementById(id);
const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const controls=simulator.snapshot();$('latency').value=String(controls.latency);$('first-full').checked=controls.firstFull;$('rate-limit').checked=controls.rateLimit;
let last='',busy=false;
if(simulator.remote){
 const box=document.querySelector('aside .control');box.replaceChildren();const heading=document.createElement('h2');heading.textContent='Shared Google Sheets backend';const message=document.createElement('p');message.textContent='Manage opening time and capacities in your spreadsheet. Run startTest in Apps Script for a fresh round. Each phone has its own demo account. Do not use real personal information.';box.append(heading,message);
 document.querySelector('.notice').textContent='Shared practice seats stored in Google Sheets. Demo account only — no real password needed.';
 document.querySelector('.demo').textContent='SHARED TEST · GOOGLE SHEETS';
 document.querySelector('#my-booking + p').textContent='Demo identity saved on this device. Reservations are shared through Google Sheets.';
 document.querySelector('aside .control:last-child p:last-child').textContent='Requests now go to your Apps Script backend. Google Sheets stores shared seats and reservations.';
}
function node(tag,text){const e=document.createElement(tag);e.textContent=text;return e;}
export function render(){
 const state=simulator.snapshot(),slots=simulator.slots();
 const left=state.opensAt-serverNow();$('clock').textContent=time.format(Date.now());
 $('opening-label').textContent=left>0?'Scheduled':'Open';
 if(left>0){const span=node('span','Registration opens in '+Math.ceil(left/1000)+' s');span.setAttribute('data-countdown',String(state.opensAt));$('course-window').replaceChildren(span);}else $('course-window').textContent='Registration is open until groups are full.';
 const signature=JSON.stringify([slots,state.booked,busy]);
 if(last!==signature){last=signature;$('slots').replaceChildren(...slots.map((s,i)=>{
  const card=document.createElement('article');card.className='slot';card.dataset.slotId=s.id;card.dataset.state=s.remaining===0?'full':s.state;
  const main=document.createElement('div');main.className='slot-main';const label=node('span',s.groupName);label.className='slot-time';label.dir='auto';const pill=node('span',s.remaining===0?'Full':left>0?'Not open yet':'Open');pill.className='pill';main.append(label,pill);
  const actions=document.createElement('div');actions.className='slot-actions';const seats=document.createElement('div');seats.className='seats';seats.append(node('b',s.remaining===0?'Full':s.remaining),node('span','of '+s.capacity+' left'));
  const button=node('button',state.booked===i?'You’re in this group':s.remaining===0?'Full':left>0?'Not open yet':'Book seat');button.className='btn';button.type='button';button.disabled=busy||state.booked===i||s.remaining===0||left>0;
  button.onclick=async()=>{busy=true;render();try{const data=await api('/api/slots/'+s.id+'/reserve',{method:'POST',body:{}});flash('Seat confirmed — '+data.message);}catch(error){flash(error.message,true);}finally{busy=false;render();}};
  actions.append(seats,button);card.append(main,actions);return card;
 }));}
 $('my-booking').textContent=state.booked===null||!slots[state.booked]?'No seat booked yet.':'Confirmed: '+slots[state.booked].groupName;
 $('footnote').textContent=slots.filter(s=>s.state==='open'&&s.remaining>0).length+' groups open now · demo account';
 $('count').textContent=state.log.length+' attempts';$('log').replaceChildren(...state.log.slice().reverse().map(entry=>{const tr=document.createElement('tr');[time.format(entry.at),entry.group,entry.result,(entry.relative/1000).toFixed(3)+' s'].forEach(value=>tr.append(node('td',value)));return tr;}));
}
function flash(text,bad=false){$('flash').hidden=false;$('flash').dataset.tone=bad?'bad':'ok';$('flash').textContent=text;}
if(!simulator.remote){
 $('latency').onchange=()=>simulator.settings({latency:Number($('latency').value)});
 $('first-full').onchange=()=>{simulator.settings({firstFull:$('first-full').checked});render();};
 $('rate-limit').onchange=()=>simulator.settings({rateLimit:$('rate-limit').checked});
 $('reset').onclick=()=>{if(window.__timedBooking)window.__timedBooking.cancel();simulator.reset({opensAt:Date.now()+Number($('delay').value)*1000,latency:Number($('latency').value),firstFull:$('first-full').checked,rateLimit:$('rate-limit').checked});for(const key of Object.keys(sessionStorage))if(key.startsWith('timed-booking-'))sessionStorage.removeItem(key);$('flash').hidden=true;render();};
}else{
 const refresh=async()=>{try{const data=await simulator.refresh();if(data)syncClock(data.serverTime);render();}catch(error){flash('Google Sheets connection failed: '+error.message,true);}};
 await refresh();setInterval(refresh,5000);
}
render();setInterval(render,200);
