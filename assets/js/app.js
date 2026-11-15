document.addEventListener("DOMContentLoaded",()=>{
 const ADMIN_URL="https://crowrulesentertainment-oss.github.io/crowrulesentertainment/back-deck-live/admin.html";
 const toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".main-nav");
 // Keep the authenticated production workspace reachable from every public page.
 if(nav&&!nav.querySelector('a[href="'+ADMIN_URL+'"]')){
  const adminLink=document.createElement("a");
  adminLink.href=ADMIN_URL;
  adminLink.className="nav-admin";
  adminLink.textContent="Admin";
  adminLink.setAttribute("aria-label","Open Back Deck Live administration");
  nav.append(adminLink);
 }
 if(toggle&&nav)toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
 document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());

 // Supabase browser client: publishable key only. RLS remains the security boundary.
 const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
 const SUPABASE_PUBLISHABLE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
 const db=window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY):null;

 // Live page: publish anonymous page presence so the admin dashboard can see active visitors.
 const liveAudience=document.querySelector("[data-live-audience]");
 const liveConnection=document.querySelector("[data-live-connection]");
 const liveConnectionDetail=document.querySelector("[data-live-connection-detail]");
 const liveDot=document.querySelector("[data-live-connection-dot]");
 let livePresenceChannel=null;
 const renderLiveAudience=()=>{
  if(!livePresenceChannel||!liveAudience)return;
  const state=livePresenceChannel.presenceState();
  const count=Object.values(state).reduce((total,sessions)=>total+(Array.isArray(sessions)?sessions.length:0),0);
  liveAudience.textContent=String(count);
 };
 if(document.querySelector("[data-live-latest]")){
  if(db){
   livePresenceChannel=db.channel("back-deck-live-home-presence",{config:{presence:{key:(window.crypto&&crypto.randomUUID)?crypto.randomUUID():"visitor-"+Math.random().toString(36).slice(2)}}});
   livePresenceChannel.on("presence",{event:"sync"},renderLiveAudience);
   livePresenceChannel.subscribe(async status=>{
    if(status==="SUBSCRIBED"){
     await livePresenceChannel.track({online_at:new Date().toISOString(),page:"back-deck-live-watch"});
     if(liveConnection)liveConnection.textContent="You're connected to the Back Deck Live community";
     if(liveConnectionDetail)liveConnectionDetail.textContent="Live visitor presence is active.";
     if(liveDot)liveDot.classList.add("connected");
     renderLiveAudience();
    }else if(["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(status)){
     if(liveConnection)liveConnection.textContent="Community connection temporarily unavailable";
     if(liveConnectionDetail)liveConnectionDetail.textContent="The video and YouTube links remain available.";
     if(liveAudience)liveAudience.textContent="—";
     if(liveDot)liveDot.classList.remove("connected");
    }
   });
   window.addEventListener("pagehide",()=>{if(livePresenceChannel)livePresenceChannel.untrack();},{once:true});
  }else{
   if(liveConnection)liveConnection.textContent="Community connection unavailable";
   if(liveConnectionDetail)liveConnectionDetail.textContent="Please refresh to reconnect.";
  }
  const loadLiveEpisode=async()=>{
   const shell=document.querySelector("[data-live-latest]");
   if(!db||!shell)return;
   try{
    const {data,error}=await db.from("back_deck_episodes").select("title,description,youtube_video_id,published_at").eq("is_published",true).eq("show_in_main_player",true).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;
    if(!data?.youtube_video_id)throw new Error("No published episode is available yet.");
    if(!/^[A-Za-z0-9_-]{11}$/.test(data.youtube_video_id))throw new Error("The latest episode video is not configured correctly.");
    const frame=document.createElement("iframe");
    frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(data.youtube_video_id)+"?rel=0";
    frame.title=data.title||"Latest Back Deck Live episode";
    frame.loading="lazy";frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen=true;
    shell.replaceChildren(frame);
    const title=document.querySelector("[data-live-episode-title]");
    const description=document.querySelector("[data-live-episode-description]");
    const link=document.querySelector("[data-live-episode-link]");
    if(title)title.textContent=data.title||"Latest Back Deck Live episode";
    if(description)description.textContent=data.description||"Watch the latest Back Deck Live conversation.";
    if(link)link.href="https://www.youtube.com/watch?v="+encodeURIComponent(data.youtube_video_id);
    if(link)link.textContent="Watch on YouTube ↗";
   }catch(error){
    console.warn("Back Deck Live latest episode could not load:",error.message);
    shell.replaceChildren();
    const empty=document.createElement("div");empty.className="live-player-placeholder";
    const heading=document.createElement("p");heading.textContent="THE LATEST EPISODE WILL APPEAR HERE";
    const detail=document.createElement("small");detail.textContent="Visit the episodes page to browse published conversations.";
    empty.append(heading,detail);shell.append(empty);
    const title=document.querySelector("[data-live-episode-title]");if(title)title.textContent="Latest episode not available";
    const description=document.querySelector("[data-live-episode-description]");if(description)description.textContent="Check back soon for the next conversation.";
   }
  };
  loadLiveEpisode();

  // YouTube live status is generated server-side by GitHub Actions; no API key ships to visitors.
  const liveStatusMessage=document.querySelector("[data-youtube-live-message]");
  const liveStatusPlayer=document.querySelector("[data-youtube-live-player]");
  const liveStatusTitle=document.querySelector("[data-youtube-live-title]");
  const liveStatusLink=document.querySelector("[data-youtube-live-link]");
  const loadYouTubeLiveStatus=async()=>{
   try{
    const response=await fetch("./live-status.json?ts="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error("Live status file unavailable");
    const status=await response.json();
    if(liveStatusLink&&status.channelUrl)liveStatusLink.href=status.channelUrl;
    if(status.setupRequired){
     if(liveStatusMessage)liveStatusMessage.textContent="YouTube API setup is almost ready. Add the YOUTUBE_API_KEY repository secret and run the GitHub Actions workflow.";
     return;
    }
    if(status.isLive&&status.videoId&&/^[A-Za-z0-9_-]{11}$/.test(status.videoId)){
     if(liveStatusMessage)liveStatusMessage.textContent="We're live now on YouTube. Join the broadcast below.";
     if(liveStatusTitle)liveStatusTitle.textContent=status.title||"Back Deck Live — Broadcasting now";
     if(liveStatusPlayer){
      const frame=document.createElement("iframe");
      frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(status.videoId)+"?rel=0";
      frame.title=status.title||"Back Deck Live — Live broadcast";
      frame.loading="lazy";frame.referrerPolicy="strict-origin-when-cross-origin";
      frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen=true;
      liveStatusPlayer.replaceChildren(frame);
      liveStatusPlayer.hidden=false;
     }
    }else if(liveStatusMessage){
     const checked=status.checkedAt?new Date(status.checkedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}):"";
     liveStatusMessage.textContent="No active public livestream is showing right now."+(checked?" Last checked "+checked+".":"")+" Check back at our next scheduled broadcast.";
    }
   }catch(error){
    console.warn("Back Deck Live YouTube status unavailable:",error.message);
    if(liveStatusMessage)liveStatusMessage.textContent="Live status is temporarily unavailable. You can still check the CrowRules TV YouTube channel.";
   }
  };
  loadYouTubeLiveStatus();
  window.setInterval(loadYouTubeLiveStatus,5*60*1000);
 }

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
  let submissionType=String(values.get("submission_type")||form.dataset.submissionType||"Topic idea");
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