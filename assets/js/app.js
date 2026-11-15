document.addEventListener("DOMContentLoaded",()=>{
 const toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".main-nav");
 if(toggle&&nav)toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
 document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());
 document.querySelectorAll("[data-demo-form]").forEach(form=>form.addEventListener("submit",e=>{e.preventDefault();const msg=form.querySelector("[data-form-message]");if(msg)msg.textContent="Thanks for reaching out. Online submissions will be enabled when the secure Supabase connection is configured."; }));
 const nodes={days:document.querySelector("[data-count-days]"),hours:document.querySelector("[data-count-hours]"),minutes:document.querySelector("[data-count-minutes]"),seconds:document.querySelector("[data-count-seconds]"),message:document.querySelector("[data-countdown-message]")};
 if(!nodes.days)return;
 const zone="America/Los_Angeles";
 const partsAt=date=>Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"numeric",day:"numeric",weekday:"short",hour:"numeric",minute:"numeric",second:"numeric",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,p.value]));
 const nextBroadcast=now=>{
  const p=partsAt(now),weekdays={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  let days=(6-weekdays[p.weekday]+7)%7;
  if(days===0&&(Number(p.hour)>15||(Number(p.hour)===15&&(Number(p.minute)>0||Number(p.second)>0))))days=7;
  const day=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)+days));
  const targetAsUtc=Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate(),15,0,0);
  const represented=partsAt(new Date(targetAsUtc));
  const representedAsUtc=Date.UTC(Number(represented.year),Number(represented.month)-1,Number(represented.day),Number(represented.hour),Number(represented.minute),Number(represented.second));
  return new Date(targetAsUtc-(representedAsUtc-targetAsUtc));
 };
 const tick=()=>{
  const now=new Date(),target=nextBroadcast(now),remaining=Math.max(0,target-now);
  const total=Math.floor(remaining/1000),d=Math.floor(total/86400),h=Math.floor(total%86400/3600),m=Math.floor(total%3600/60),s=total%60;
  nodes.days.textContent=String(d).padStart(2,"0");nodes.hours.textContent=String(h).padStart(2,"0");nodes.minutes.textContent=String(m).padStart(2,"0");nodes.seconds.textContent=String(s).padStart(2,"0");
  if(nodes.message)nodes.message.textContent=d===0&&h===0&&m===0?"We're gathering now — come join the conversation!":"Your next seat on the deck is waiting.";
 };
 tick();setInterval(tick,1000);
});