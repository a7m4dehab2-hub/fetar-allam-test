import {createSimulator} from './model.js';
import {GOOGLE_SCRIPT_URL} from './config.js';
import {createSheetsBackend} from './sheets-backend.js';
export const simulator=GOOGLE_SCRIPT_URL?createSheetsBackend(GOOGLE_SCRIPT_URL):createSimulator({storage:localStorage});
export const api=(...args)=>simulator.api(...args);
let offset=0;
export function syncClock(time){if(Number.isFinite(time))offset=time-Date.now();}
export const serverNow=()=>Date.now()+offset;
