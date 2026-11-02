importScripts('engine.js');
self.onmessage=({data})=>{const {id,metins,dps,minutes,travel,seed}=data;const runs={};metins.forEach((m,i)=>runs[m.id]=Calc.simulate(m,dps,minutes,travel,(seed+m.hp)>>>0));self.postMessage({id,runs});};
