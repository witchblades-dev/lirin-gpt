/* Independent calculation engine. Game recipes live separately in data.js. */
(function(root){
'use strict';
function amount(value){
 let s=String(value).trim().toLowerCase().replace(/\s/g,'');
 if(!s)return 0;
 if(/^[1-9]\d{0,2}([.,]\d{3})+$/.test(s))s=s.replace(/[.,]/g,'');
 const m=s.replace(',','.').match(/^(\d+(?:\.\d*)?|\.\d+)(k{0,3})$/);
 if(!m)return null;const n=Number(m[1])*1000**m[2].length;
 return Number.isFinite(n)&&n<=1e12?n:null;
}
function upgrade(item,enabled,failures,adjustments,prices){
 const quantities={};let fee=0;
 item.steps.forEach((row,i)=>{if(!row||enabled[i]===false)return;
 const attempts=1+(i===0?0:Math.max(0,Math.min(item.fails?.[i]||99,Math.floor(failures[i]||0))));
 fee+=row[0]*attempts;for(let j=1;j<row.length;j+=2)quantities[row[j]]=(quantities[row[j]]||0)+row[j+1]*attempts;
 });
 let materials=0;const required={...quantities};
 for(const id of Object.keys(quantities)){quantities[id]=Math.max(0,quantities[id]+(adjustments[id]||0));materials+=quantities[id]*(prices[id]||0);}
 return{required,quantities,fee,materials,total:fee+materials};
}
function gaya(qty,stone,dust){const materials=stone+10*dust;return{materials,fee:250000,unit:materials+250000,total:qty*(materials+250000)};}
function convolution(a,b){const c=Array(10).fill(0);for(let i=0;i<10;i++)for(let j=0;j<10;j++)c[(i+j)%10]+=a[i]*b[j];return c;}
function expectedRemainder(n,p,lo,hi){let base=Array(10).fill(0),r=Array(10).fill(0);r[0]=1;base[0]=1-p;for(let k=lo;k<=hi;k++)base[k%10]+=p/(hi-lo+1);while(n>0){if(n%2)r=convolution(r,base);base=convolution(base,base);n=Math.floor(n/2);}return r.reduce((s,p,i)=>s+p*i,0);}
function expected(m,n,prices){let mean=0,variance=0;
 for(const [name,ch,lo,hi,,conversion] of m.drops){const p=ch/100,avg=(lo+hi)/2,total=n*p*avg;let unit;
 if(conversion?.yang){unit=conversion.yang;mean+=unit*total;}
 else if(conversion?.to){const price=prices[conversion.to]||0;unit=price/10;mean+=Math.max(0,(total-expectedRemainder(n,p,lo,hi))/10)*price;}
 else{unit=prices[name]||0;mean+=unit*total;}
 variance+=n*(p*((((hi-lo+1)**2-1)/12)+avg*avg)-p*p*avg*avg)*unit*unit;
 }return{mean,low:Math.max(0,mean-1.281551566*Math.sqrt(variance)),high:mean+1.281551566*Math.sqrt(variance)};
}
function random(seed){let a=seed>>>0;return()=>{a=(Math.imul(1664525,a)+1013904223)>>>0;return a/4294967296;};}
function simulate(m,dps,minutes,travel,seed){
 const kills=Math.floor(minutes*60/(m.hp/dps+travel));const counts={},items={};let coupons=0;
 const r=random(seed);
 for(const [name,ch,lo,hi,,conversion] of m.drops){let count=0;
 if(ch===100&&lo===hi)count=kills*lo;
 else for(let i=0;i<kills;i++)if(ch===100||r()<ch/100)count+=lo+Math.floor(r()*(hi-lo+1));
 counts[name]=count;if(conversion?.yang)coupons+=count*conversion.yang;
 else{const key=conversion?.to||name;items[key]=(items[key]||0)+(conversion?.to?Math.floor(count/10):count);}
 }return{kills,counts,items,coupons};
}
const api={amount,upgrade,gaya,expectedRemainder,expected,simulate};
if(typeof module!=='undefined')module.exports=api;else root.Calc=api;
})(globalThis);
