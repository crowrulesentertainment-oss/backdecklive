import { writeFile } from "node:fs/promises";

const apiKey = process.env.YOUTUBE_API_KEY;
const channelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || "CrowRules_TV";
const suppliedChannelId = process.env.YOUTUBE_CHANNEL_ID;
if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY repository secret.");

async function youtube(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [key, value] of Object.entries({ ...params, key: apiKey })) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `YouTube API request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

let channelId = suppliedChannelId;
if (!channelId) {
  const channels = await youtube("channels", { part: "id", forHandle: channelHandle });
  channelId = channels.items?.[0]?.id;
}
if (!channelId) throw new Error(`Could not resolve YouTube channel handle: ${channelHandle}`);

const result = await youtube("search", {
  part: "snippet",
  channelId,
  eventType: "live",
  type: "video",
  maxResults: "1"
});
const video = result.items?.[0];
const status = {
  channelId,
  channelHandle,
  channelUrl: `https://www.youtube.com/@${channelHandle}/live`,
  isLive: Boolean(video?.id?.videoId),
  videoId: video?.id?.videoId || null,
  title: video?.snippet?.title || null,
  description: video?.snippet?.description || null,
  thumbnail: video?.snippet?.thumbnails?.high?.url || video?.snippet?.thumbnails?.medium?.url || null,
  checkedAt: new Date().toISOString()
};

await writeFile("pages/live/live-status.json", JSON.stringify(status, null, 2) + "\n");
console.log(status.isLive
  ? `Active YouTube livestream found: ${status.title} (${status.videoId})`
  : "No active public livestream found. Live status set to offline.");
