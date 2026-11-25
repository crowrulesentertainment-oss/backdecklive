document.addEventListener("DOMContentLoaded",()=>{
 const ADMIN_URL="https://crowrulesentertainment-oss.github.io/backdecklive/production-center/";
 const toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".main-nav");
 // Keep the authenticated production workspace reachable from every public page.
 const existingAdminLink=nav?.querySelector(".nav-admin");
 if(existingAdminLink){
  existingAdminLink.href=ADMIN_URL;
  existingAdminLink.textContent="Production Center";
  existingAdminLink.setAttribute("aria-label","Open Back Deck Live Production Center");
  existingAdminLink.removeAttribute("target");
  existingAdminLink.removeAttribute("rel");
 }else if(nav){
  const adminLink=document.createElement("a");
  adminLink.href=ADMIN_URL;
  adminLink.className="nav-admin";
  adminLink.textContent="Production Center";
  adminLink.setAttribute("aria-label","Open Back Deck Live Production Center");
  nav.append(adminLink);
 }

 if(nav){
  const extraLinks=[{label:"Schedule",path:"pages/schedule/"},{label:"People",path:"pages/crew/"},{label:"FAQ",path:"pages/faq/"},{label:"Contact",path:"pages/contact/"}];
  extraLinks.forEach(item=>{
   const target=new URL(item.path,"https://crowrulesentertainment-oss.github.io/backdecklive/").pathname;
   const exists=[...nav.querySelectorAll("a")].some(link=>{try{return new URL(link.href).pathname===target;}catch{return false;}});
   if(exists)return;
   const link=document.createElement("a");
   link.href="https://crowrulesentertainment-oss.github.io/backdecklive/"+item.path;
   link.textContent=item.label;
   if(window.location.pathname===target||window.location.pathname.startsWith(target)){link.classList.add("active");link.setAttribute("aria-current","page");}
   nav.insertBefore(link,nav.querySelector(".nav-admin")||null);
  });
 }

 if(toggle&&nav)toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
 document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());

 // Supabase browser client: publishable key only. RLS remains the security boundary.
 const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
 const SUPABASE_PUBLISHABLE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
 const BACK_DECK_LIVE_API="https://cevylpnoexugwgygvtgu.supabase.co/functions/v1/back-deck-live-api";
 const YOUTUBE_CHANNEL_ID="UC03D_GFGP1NqtnXwt1uXusA";
 const YOUTUBE_CHANNEL_URL="https://www.youtube.com/@CrowRules_TV";
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

  // Reuse the already-configured Back Deck Live API and CrowRules TV channel.
  // The API's YouTube credentials remain in the existing Supabase Edge Function secrets.
  const liveStatusMessage=document.querySelector("[data-youtube-live-message]");
  const liveStatusPlayer=document.querySelector("[data-youtube-live-player]");
  const liveStatusTitle=document.querySelector("[data-youtube-live-title]");
  const liveStatusLink=document.querySelector("[data-youtube-live-link]");
  const subscriberCount=document.querySelector("[data-youtube-subscriber-count]");
  const subscriberGoal=document.querySelector("[data-youtube-subscriber-goal]");
  const subscriberProgress=document.querySelector("[data-youtube-subscriber-progress]");
  const subscriberMessage=document.querySelector("[data-youtube-subscriber-message]");
  if(liveStatusLink)liveStatusLink.href=YOUTUBE_CHANNEL_URL+"/streams";
  const liveChat=document.querySelector("[data-youtube-live-chat]");
  const liveConnectForm=document.querySelector("[data-youtube-live-connect]");
  const liveChatStatus=document.querySelector("[data-youtube-chat-status]");
  const liveUrlInput=document.querySelector("#youtube-live-url");
  const siteHost=window.location.hostname;
  const videoIdFromUrl=value=>{
   try{
    const url=new URL(String(value||"").trim());
    let id=url.searchParams.get("v");
    if(!id&&url.hostname.toLowerCase()==="youtu.be")id=url.pathname.split("/").filter(Boolean)[0];
    if(!id&&(url.hostname.toLowerCase()==="youtube.com"||url.hostname.toLowerCase().endsWith(".youtube.com")))id=url.pathname.split("/").filter(Boolean).find((part,index,parts)=>["live","embed","shorts"].includes(parts[index-1]));
    return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?id:"";
   }catch{return "";}
  };
  const showLiveVideoAndChat=id=>{
   if(!id)return false;
   if(liveStatusPlayer){
    const frame=document.createElement("iframe");
    frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?rel=0&modestbranding=1";
    frame.title="Back Deck Live — CrowRules TV live broadcast";
    frame.loading="eager";frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen=true;liveStatusPlayer.replaceChildren(frame);
   }
   if(liveChat){
    const chat=document.createElement("iframe");
    chat.src="https://www.youtube.com/live_chat?v="+encodeURIComponent(id)+"&embed_domain="+encodeURIComponent(siteHost)+"&dark_theme=1";
    chat.title="Back Deck Live YouTube live chat";
    chat.loading="eager";chat.referrerPolicy="strict-origin-when-cross-origin";
    chat.allow="clipboard-write";liveChat.replaceChildren(chat);
   }
   if(liveUrlInput)liveUrlInput.value="https://www.youtube.com/watch?v="+id;
   if(liveChatStatus)liveChatStatus.textContent="The broadcast video and matching YouTube live chat are connected.";
   return true;
  };
  if(liveStatusPlayer){
   const frame=document.createElement("iframe");
   frame.src="https://www.youtube-nocookie.com/embed/zLQ5Zs1_z6U?rel=0&modestbranding=1";
   frame.title="Back Deck Live — CrowRules TV live stream";
   frame.loading="lazy";frame.referrerPolicy="strict-origin-when-cross-origin";
   frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
   frame.allowFullscreen=true;
   liveStatusPlayer.replaceChildren(frame);
   liveStatusPlayer.hidden=false;
   showLiveVideoAndChat("zLQ5Zs1_z6U");
  }
  if(liveConnectForm){
   liveConnectForm.addEventListener("submit",event=>{
    event.preventDefault();
    const id=videoIdFromUrl(liveUrlInput?.value);
    if(!id){
     if(liveChatStatus)liveChatStatus.textContent="That link doesn’t look like a YouTube video or live broadcast URL. Paste the full YouTube watch link.";
     return;
    }
    showLiveVideoAndChat(id);
   });
   const params=new URLSearchParams(window.location.search);
   const queryVideo=params.get("video")||params.get("v");
   if(queryVideo&&/^[A-Za-z0-9_-]{11}$/.test(queryVideo))showLiveVideoAndChat(queryVideo);
  }
  const upcomingNodes={
   state:document.querySelector("[data-upcoming-live-state]"),
   date:document.querySelector("[data-upcoming-live-date]"),
   description:document.querySelector("[data-upcoming-live-description]"),
   days:document.querySelector("[data-upcoming-days]"),
   hours:document.querySelector("[data-upcoming-hours]"),
   minutes:document.querySelector("[data-upcoming-minutes]"),
   seconds:document.querySelector("[data-upcoming-seconds]"),
   label:document.querySelector("[data-upcoming-live-countdown-label]"),
   calendar:document.querySelector("[data-upcoming-calendar]")
  };
  const getNextBackDeckShow=()=>{
   const zone="America/Los_Angeles";
   const partsAt=date=>Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"numeric",day:"numeric",weekday:"short",hour:"numeric",minute:"numeric",second:"numeric",hourCycle:"h23"}).formatToParts(date).map(part=>[part.type,part.value]));
   const now=new Date(),parts=partsAt(now),weekday={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
   let days=(6-weekday[parts.weekday]+7)%7;
   if(days===0&&(Number(parts.hour)>15||(Number(parts.hour)===15&&(Number(parts.minute)>0||Number(parts.second)>0))))days=7;
   const calendarDay=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)+days));
   const targetUtc=Date.UTC(calendarDay.getUTCFullYear(),calendarDay.getUTCMonth(),calendarDay.getUTCDate(),15,0,0);
   const represented=partsAt(new Date(targetUtc));
   const representedUtc=Date.UTC(Number(represented.year),Number(represented.month)-1,Number(represented.day),Number(represented.hour),Number(represented.minute),Number(represented.second));
   return new Date(targetUtc-(representedUtc-targetUtc));
  };
  const updateUpcomingLive=()=>{
   if(!upcomingNodes.days)return;
   const now=new Date(),target=getNextBackDeckShow(),remaining=Math.max(0,target-now),total=Math.floor(remaining/1000);
   const dateLabel=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"long",month:"long",day:"numeric"}).format(target);
   const timeLabel=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(target);
   upcomingNodes.date.textContent=dateLabel+" · "+timeLabel;
   upcomingNodes.days.textContent=String(Math.floor(total/86400)).padStart(2,"0");
   upcomingNodes.hours.textContent=String(Math.floor(total%86400/3600)).padStart(2,"0");
   upcomingNodes.minutes.textContent=String(Math.floor(total%3600/60)).padStart(2,"0");
   upcomingNodes.seconds.textContent=String(total%60).padStart(2,"0");
   if(upcomingNodes.label)upcomingNodes.label.textContent=total===0?"Showtime!": "Until the next Saturday gathering.";
   if(upcomingNodes.calendar){
    const end=new Date(target.getTime()+60*60*1000);
    const stamp=date=>new Intl.DateTimeFormat("en-CA",{timeZone:"UTC",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date).replace(/[^0-9]/g,"").slice(0,12);
    const params=new URLSearchParams({action:"TEMPLATE",text:"Back Deck Live — CrowRules TV",details:"Join Back Deck Live every Saturday at 3:00 PM Pacific on CrowRules TV.",dates:stamp(target)+"/"+stamp(end),ctz:"America/Los_Angeles",recur:"RRULE:FREQ=WEEKLY;BYDAY=SA"});
    upcomingNodes.calendar.href="https://calendar.google.com/calendar/render?"+params.toString();
   }
  };
  if(upcomingNodes.days){updateUpcomingLive();window.setInterval(updateUpcomingLive,1000);}
  let discoveredLiveVideoId="";
  const discoverActiveYouTubeLive=async()=>{
   try{
    // Admin-selected Back Deck Live broadcast takes priority over automatic channel discovery.
    let managed=null;
    if(db){
     const managedResult=await db.from("back_deck_live_broadcasts").select("title,youtube_video_id,status,is_featured,updated_at").eq("is_featured",true).eq("status","live").maybeSingle();
     if(!managedResult.error)managed=managedResult.data;
     else console.warn("Managed Back Deck Live broadcast lookup unavailable:",managedResult.error.message);
    }
    if(managed&&/^[A-Za-z0-9_-]{11}$/.test(managed.youtube_video_id||"")){
     if(discoveredLiveVideoId!==managed.youtube_video_id){discoveredLiveVideoId=managed.youtube_video_id;showLiveVideoAndChat(managed.youtube_video_id);}
     if(upcomingNodes.state){upcomingNodes.state.textContent="ON AIR NOW";upcomingNodes.state.classList.add("is-live");}
     if(upcomingNodes.description)upcomingNodes.description.textContent="The Back Deck Live team has selected this broadcast — join the live conversation.";
     if(liveStatusTitle)liveStatusTitle.textContent=managed.title||"Back Deck Live — CrowRules TV";
     if(liveStatusMessage)liveStatusMessage.textContent="The featured Back Deck Live broadcast and its matching YouTube Live Chat are connected.";
     if(liveChatStatus)liveChatStatus.textContent="Featured broadcast selected by the production team — video and chat are synced.";
     return;
    }
    const response=await fetch(BACK_DECK_LIVE_API+"?action=youtube-live",{method:"GET",headers:{"Accept":"application/json"},cache:"no-store"});
    const data=await response.json();
    if(!response.ok||data.ok===false)throw new Error(data.error||"Live broadcast lookup failed.");
    if(data.live&&data.videoId&&/^[A-Za-z0-9_-]{11}$/.test(data.videoId)){
     if(discoveredLiveVideoId!==data.videoId){discoveredLiveVideoId=data.videoId;showLiveVideoAndChat(data.videoId);}
     if(upcomingNodes.state){upcomingNodes.state.textContent="ON AIR NOW";upcomingNodes.state.classList.add("is-live");}
     if(upcomingNodes.description)upcomingNodes.description.textContent="We're live right now — join the current broadcast and chat on CrowRules TV.";
     if(liveStatusTitle)liveStatusTitle.textContent=data.title||"Back Deck Live — CrowRules TV";
     if(liveStatusMessage)liveStatusMessage.textContent="An active CrowRules TV broadcast was found automatically. The video and matching live chat are connected.";
     if(liveChatStatus)liveChatStatus.textContent="Active broadcast detected automatically — video and live chat are synced.";
    }else if(!discoveredLiveVideoId){
     if(upcomingNodes.state){upcomingNodes.state.textContent="UP NEXT";upcomingNodes.state.classList.remove("is-live");}
     if(upcomingNodes.description)upcomingNodes.description.textContent="Join us every Saturday for conversation, community, and a little time on the deck.";
     if(liveStatusMessage)liveStatusMessage.textContent="No active public live broadcast is detected right now. This player will connect automatically when Back Deck Live goes live.";
     if(liveChatStatus)liveChatStatus.textContent="Waiting for the next live broadcast. Video and chat will connect automatically.";
    }else{
     if(upcomingNodes.state){upcomingNodes.state.textContent="UP NEXT";upcomingNodes.state.classList.remove("is-live");}
     if(upcomingNodes.description)upcomingNodes.description.textContent="The last broadcast has wrapped. Join us for the next Saturday gathering.";
     discoveredLiveVideoId="";
     if(liveStatusTitle)liveStatusTitle.textContent="Back Deck Live — CrowRules TV";
     if(liveStatusMessage)liveStatusMessage.textContent="The previous broadcast has ended. Waiting for the next live show.";
     if(liveChat){const empty=document.createElement("div");empty.className="youtube-chat-empty";const heading=document.createElement("strong");heading.textContent="Chat is ready when the show goes live.";const note=document.createElement("p");note.textContent="The next active broadcast and its chat will connect automatically.";empty.append(heading,note);liveChat.replaceChildren(empty);}
    }
   }catch(error){
    console.warn("Back Deck Live active broadcast discovery unavailable:",error.message);
    if(liveChatStatus&&!discoveredLiveVideoId)liveChatStatus.textContent="Automatic live detection is temporarily unavailable. The channel player remains available.";
   }
  };
  discoverActiveYouTubeLive();
  window.setInterval(discoverActiveYouTubeLive,60*1000);
  if(liveStatusTitle)liveStatusTitle.textContent="Back Deck Live — CrowRules TV";
  if(liveStatusMessage)liveStatusMessage.textContent="Live channel player connected. When a broadcast is active, it will appear here.";
  const loadYouTubeSubscriberStats=async()=>{
   if(!subscriberCount)return;
   try{
    const response=await fetch(BACK_DECK_LIVE_API+"?action=subscribers",{method:"GET",headers:{"Accept":"application/json"},cache:"no-store"});
    const data=await response.json();
    if(!response.ok||data.ok===false||data.success===false)throw new Error(data.error||data.message||"YouTube statistics request failed.");
    const count=Number(data.subscriberCount??data.subscriber_count??data.subscribers);
    const goalValue=Number(data.goal??data.subscriberGoal??1000);
    const goal=Number.isFinite(goalValue)&&goalValue>0?goalValue:1000;
    if(subscriberGoal)subscriberGoal.textContent=goal.toLocaleString("en-US");
    if(!Number.isFinite(count)||count<0){
     subscriberCount.textContent="—";
     if(subscriberMessage)subscriberMessage.textContent=data.hidden?"Subscriber totals are hidden for this channel.":"The YouTube API did not return a subscriber count.";
     if(subscriberProgress)subscriberProgress.style.width="0%";
     return;
    }
    subscriberCount.textContent=count.toLocaleString("en-US");
    if(subscriberProgress)subscriberProgress.style.width=Math.min(100,count/goal*100)+"%";
    if(subscriberMessage)subscriberMessage.textContent=data.hidden?"Subscriber totals are hidden for this channel.":"Live channel statistics supplied by the existing Back Deck Live API.";
   }catch(error){
    console.warn("Back Deck Live YouTube subscriber stats unavailable:",error.message);
    subscriberCount.textContent="—";
    if(subscriberMessage)subscriberMessage.textContent="YouTube statistics are temporarily unavailable. The live channel player remains available.";
   }
  };
  loadYouTubeSubscriberStats();
  window.setInterval(loadYouTubeSubscriberStats,15*60*1000);
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
 const episodeSearch=document.querySelector("[data-episode-search]");
 const episodeResults=document.querySelector("[data-episode-results]");
 const filterEpisodeCards=()=>{
  const grid=document.querySelector("[data-episode-grid]");
  if(!grid)return;
  const query=String(episodeSearch?.value||"").trim().toLowerCase();
  const cards=[...grid.querySelectorAll(".episode-card")];
  let visible=0;
  cards.forEach(card=>{const match=!query||card.textContent.toLowerCase().includes(query);card.hidden=!match;if(match)visible++;});
  if(episodeResults)episodeResults.textContent=query?visible+" matching episode(s).":cards.length+" published episode(s).";
 };
 if(episodeSearch)episodeSearch.addEventListener("input",filterEpisodeCards);

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
    const videoId=String(ep.youtube_video_id||"").trim();
    const videoUrl=/^[A-Za-z0-9_-]{11}$/.test(videoId)?"https://www.youtube.com/watch?v="+encodeURIComponent(videoId):"";
    if(videoUrl){
     const thumbnailLink=document.createElement("a");thumbnailLink.className="episode-thumbnail-link";thumbnailLink.href=videoUrl;thumbnailLink.target="_blank";thumbnailLink.rel="noopener";thumbnailLink.setAttribute("aria-label","Watch "+(ep.title||"Back Deck Live episode"));
     const thumbnail=document.createElement("img");thumbnail.className="episode-thumbnail";thumbnail.src="https://i.ytimg.com/vi/"+encodeURIComponent(videoId)+"/hqdefault.jpg";thumbnail.alt=(ep.title||"Back Deck Live episode")+" video thumbnail";thumbnail.loading="lazy";thumbnail.decoding="async";
     thumbnailLink.append(thumbnail);card.append(thumbnailLink);
    }else{
     const placeholder=document.createElement("div");placeholder.className="episode-thumbnail episode-thumbnail-placeholder";placeholder.textContent="BACK DECK LIVE";card.append(placeholder);
    }
    const heading=document.createElement("h2");heading.textContent=ep.title||"Back Deck Live episode";
    const category=document.createElement("p");category.className="eyebrow";category.textContent=ep.category||"Back Deck Conversations";
    const desc=document.createElement("p");desc.textContent=ep.description||"";
    const link=document.createElement("a");link.className="button button-gold";link.href=videoUrl||"https://www.youtube.com/@CrowRules_TV";link.target="_blank";link.rel="noopener";link.textContent="Watch episode ↗";
    card.append(category,heading,desc,link);grid.append(card);
    filterEpisodeCards();
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