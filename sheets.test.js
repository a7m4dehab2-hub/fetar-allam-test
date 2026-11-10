import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../google-sheets/Code.gs',import.meta.url),'utf8');
function fixture(){
 const tables={Settings:[['Key','Value'],['opensAt',new Date(Date.now()-1000).toISOString()]],Groups:[['slotId','groupName','capacity'],['slt_demo0','First',1],['slt_demo1','Backup',1]],Bookings:[['clientId','slotId','bookedAt']],Requests:[['timestamp','clientId','slotId','result']]};
 let busy=false;
 const ss={getSheetByName(name){return {getDataRange:()=>({getValues:()=>tables[name].map(row=>row.slice())}),appendRow:row=>tables[name].push(row)};}};
 const context=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'sheet'})},SpreadsheetApp:{openById:()=>ss,flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>!busy,releaseLock(){}})},ContentService:{MimeType:{JSON:'JSON'},createTextOutput:s=>({setMimeType:()=>s})}});
 vm.runInContext(source,context);
 function call(clientId,path,method='GET'){return JSON.parse(context.doPost({postData:{contents:JSON.stringify({clientId,courseId:'test-repo',path,method})}}));}
 return {tables,call,busy:()=>{busy=true;}};
}
test('shared capacity, explicit full fallback, idempotence and one booking per identity',()=>{
 const f=fixture(),a='phone_A_123456789',b='phone_B_123456789';
 assert.equal(f.call(a,'/api/slots/slt_demo0/reserve','POST').ok,true);
 assert.equal(f.call(b,'/api/slots/slt_demo0/reserve','POST').code,'SLOT_FULL');
 assert.equal(f.call(b,'/api/slots/slt_demo1/reserve','POST').ok,true);
 assert.equal(f.call(a,'/api/slots/slt_demo0/reserve','POST').data.alreadyBooked,true);
 assert.equal(f.call(a,'/api/slots/slt_demo1/reserve','POST').code,'ALREADY_IN_COURSE');
 assert.equal(f.tables.Bookings.length,3);
 const mine=f.call(b,'/api/me/bookings').data.bookings;assert.equal(mine.length,1);assert.equal(mine[0].id,'slt_demo1');assert.equal(mine[0].courseId,'test-repo');
 assert.equal(f.call(a,'/api/courses/test-repo').data.slots[0].remaining,0);
});
test('early rejection, busy lock and no public reset',()=>{
 const f=fixture(),a='phone_A_123456789';f.tables.Settings[1][1]=new Date(Date.now()+60000).toISOString();
 assert.equal(f.call(a,'/api/slots/slt_demo0/reserve','POST').code,'SLOT_NOT_OPEN');assert.equal(f.tables.Bookings.length,1);
 assert.equal(f.call(a,'/admin/reset','POST').status,404);
 f.busy();assert.equal(f.call(a,'/api/me').status,429);
});
