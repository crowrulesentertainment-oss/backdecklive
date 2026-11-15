document.addEventListener("DOMContentLoaded",()=>{
 const toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".main-nav");
 if(toggle&&nav)toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
 document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());

 // Supabase browser client: publishable key only. RLS remains the security boundary.
 const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
 const SUPABASE_PUBLISHABLE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
 const db=window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY):null;

 const makePlayer=(videoId,title)=>{
  const shell=document.querySelector("[data-main-video]");
  if(!shell||!videoId||!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId))return;
  shell.replaceChildren();
  const frame=document.createElement("iframe");
  frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(videoId);
  frame.title=title||"Back Deck Live featured video";
  frame.loading="lazy";
  frame.referrerPolicy="strict-origin-when-cross-origin";
  frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen=true;
  shell.append(frame);
 };
 const loadFeatured=async()=>{
  if(!db)return;
  const shell=document.querySelector("[data-main-video]");
  if(!shell)return;
  try{
   const {data,error}=await db.from("back_deck_main_video").select("youtube_video_id,title,description,video_type,video_url").eq("setting_key","main").maybeSingle();
   if(error)throw error;
   if(data?.video_type==="youtube"&&data.youtube_video_id)makePlayer(data.youtube_video_id,data.title);
  }catch(error){console.warn("Back Deck Live featured video could not load:",error.message);}
 };
 const loadEpisodes=async()=>{
  if(!db)return;
  const grid=document.querySelector("[data-episode-grid]");
  if(!grid)return;
  try{
   const {data,error}=await db.from("back_deck_episodes").select("id,title,description,category,youtube_video_id,published_at,sort_order").eq("is_published",true).order("sort_order",{ascending:true}).order("published_at",{ascending:false});
   if(error)throw error;
   if(!data?.length){const empty=document.createElement("p");empty.className="notice";empty.textContent="New episodes will appear here as they are published.";grid.replaceChildren(empty);return;}
   grid.replaceChildren();
   data.forEach(ep=>{
    const card=document.createElement("article");card.className="content-card episode-card";
    const heading=document.createElement("h2");heading.textContent=ep.title||"Back Deck Live episode";
    const category=document.createElement("p");category.className="eyebrow";category.textContent=ep.category||"Back Deck Conversations";
    const desc=document.createElement("p");desc.textContent=ep.description||"";
    const link=document.createElement("a");link.className="button button-gold";link.href="https://www.youtube.com/watch?v="+encodeURIComponent(ep.youtube_video_id);link.target="_blank";link.rel="noopener";link.textContent="Watch episode ↗";
    card.append(category,heading,desc,link);grid.append(card);
   });
  }catch(error){console.warn("Back Deck Live episodes could not load:",error.message);}
 };
 loadFeatured();loadEpisodes();

 document.querySelectorAll("[data-supabase-form]").forEach(form=>form.addEventListener("submit",async event=>{
  event.preventDefault();
  const status=form.querySelector("[data-form-message]");
  const button=form.querySelector('button[type="submit"]');
  const say=(message)=>{if(status)status.textContent=message;};
  if(!db){say("The secure connection is unavailable right now. Please try again later.");return;}
  const values=new FormData(form);
  const website=String(values.get("website")||"").trim();
  if(website){say("Thanks — your message has been received.");return;}
  const name=String(values.get("name")||"").trim();
  const email=String(values.get("email")||"").trim();
  let submissionType=String(form.dataset.submissionType||"Topic idea");
  let message=String(values.get("message")||"").trim();
  if(form.dataset.formKind==="guest"){
   const location=String(values.get("location")||"").trim();
   const link=String(values.get("profile_link")||"").trim();
   const bio=String(values.get("bio")||"").trim();
   const topic=String(values.get("topic")||"").trim();
   message=["GUEST INTEREST APPLICATION","Location: "+location,"Website / social: "+link,"About: "+bio,"Proposed conversation: "+topic].join("\n\n");
   submissionType="Guest suggestion";
  }
  if(!name||!email||message.length<5){say("Please complete the required fields before submitting.");return;}
  if(button)button.disabled=true;
  say("Sending your submission securely…");
  try{
   const {error}=await db.from("back_deck_submissions").insert([{name,email,submission_type:submissionType,message,website:""}]);
   if(error)throw error;
   form.reset();say("Thank you! Your submission has been sent to the Back Deck Live team for review.");
  }catch(error){console.error("Back Deck Live submission failed:",error);say("We couldn't send that just now. Please check your connection and try again.");}
  finally{if(button)button.disabled=false;}
 }));

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