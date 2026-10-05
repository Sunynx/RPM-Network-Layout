const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Using native fetch available in Node.js 18+

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RUIJIE_APP_ID = process.env.RUIJIE_APP_ID;
const RUIJIE_SECRET = process.env.RUIJIE_SECRET_KEY;
const RUIJIE_CLOUD_URL = process.env.RUIJIE_CLOUD_URL || 'https://cloud-as.ruijienetworks.com';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_TARGET_ID = process.env.LINE_TARGET_ID;

// Configurable threshold (e.g. 10 minutes)
const OFFLINE_THRESHOLD_MS = 12 * 60 * 1000; // 12 minutes
const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

async function getRuijieAccessToken() {
  try {
    const res = await fetch(`${RUIJIE_CLOUD_URL}/service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appid: RUIJIE_APP_ID, secret: RUIJIE_SECRET }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.access_token || data.accessToken;
  } catch (err) {
    console.error("❌ Error fetching Ruijie Access Token:", err.message);
    return null;
  }
}

async function getRuijieGroupId(accessToken) {
  try {
    const res = await fetch(`${RUIJIE_CLOUD_URL}/service/api/group/single/tree?depth=BUILDING&access_token=${accessToken}`);
    const groupData = await res.json();

    const findFirstGroupId = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.groupId) return obj.groupId;
      if (obj.id && obj.type === "BUILDING") return obj.id;
      for (const key of Object.keys(obj)) {
        const found = findFirstGroupId(obj[key]);
        if (found) return found;
      }
      return null;
    };

    return findFirstGroupId(groupData);
  } catch (err) {
    console.error("❌ Error fetching Group ID:", err.message);
    return null;
  }
}

async function getRuijieDevices(accessToken, groupId) {
  try {
    const res = await fetch(`${RUIJIE_CLOUD_URL}/service/api/maint/devices?access_token=${accessToken}&group_id=${groupId}&page=0&per_page=1000`);
    const devData = await res.json();
    return devData.deviceList || devData.data?.deviceList || devData.data || devData.result || [];
  } catch (err) {
    console.error("❌ Error fetching Devices from Ruijie:", err.message);
    return [];
  }
}

async function sendLineOA(deviceName, deviceType, minutesOffline, dateStr) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_TARGET_ID || LINE_CHANNEL_ACCESS_TOKEN.includes('your_token_here')) {
    console.warn("⚠️ LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_ID is missing. Skipping LINE OA alert.");
    return;
  }

  try {
    const payload = {
      to: LINE_TARGET_ID,
      messages: [
        {
          type: "flex",
          altText: `🚨 ALERT: ${deviceName} ออฟไลน์`,
          contents: {
            type: "bubble",
            size: "kilo",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#ef4444",
              contents: [
                { type: "text", text: "🔴 NETWORK DOWN", weight: "bold", color: "#ffffff", size: "sm" }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    { type: "text", text: "อุปกรณ์", color: "#aaaaaa", size: "xs", flex: 2 },
                    { type: "text", text: deviceName || "-", wrap: true, color: "#333333", size: "sm", flex: 5, weight: "bold" }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    { type: "text", text: "ประเภท", color: "#aaaaaa", size: "xs", flex: 2 },
                    { type: "text", text: deviceType || "-", wrap: true, color: "#666666", size: "sm", flex: 5 }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    { type: "text", text: "ระยะเวลา", color: "#aaaaaa", size: "xs", flex: 2 },
                    { type: "text", text: `${minutesOffline} นาที`, wrap: true, color: "#ef4444", size: "sm", flex: 5, weight: "bold" }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    { type: "text", text: "ตรวจพบ", color: "#aaaaaa", size: "xs", flex: 2 },
                    { type: "text", text: dateStr, wrap: true, color: "#666666", size: "xs", flex: 5 }
                  ]
                }
              ]
            }
          }
        }
      ]
    };

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error(`❌ Line OA failed: ${res.status} ${res.statusText} - ${errData}`);
    } else {
      console.log(`✅ Sent Line OA Alert for: ${deviceName}`);
    }
  } catch (err) {
    console.error("❌ Error sending Line OA:", err.message);
  }
}

async function syncDevicesAndAlert() {
  console.log(`\n[${new Date().toISOString()}] 🔄 Starting Ruijie Cloud Sync...`);

  const accessToken = await getRuijieAccessToken();
  if (!accessToken) return;

  const groupId = await getRuijieGroupId(accessToken);
  if (!groupId) {
    console.warn("⚠️ Could not find a valid Group ID. Sync aborted.");
    return;
  }

  const cloudDevices = await getRuijieDevices(accessToken, groupId);
  console.log(`📡 Fetched ${cloudDevices.length} devices from Ruijie Cloud.`);

  // 1. Fetch current devices from Supabase
  const { data: dbDevices, error: dbError } = await supabase.from('devices').select('*');
  if (dbError) {
    console.error("❌ Supabase Error:", dbError.message);
    return;
  }

  const now = new Date();

  const normalizeMac = (mac) => (mac || '').toLowerCase().replace(/[^a-f0-9]/g, '');

  const cloudDeviceMap = new Map();
  for (const cd of cloudDevices) {
    const mac = normalizeMac(cd.mac || cd.macAddress);
    if (mac) {
      cloudDeviceMap.set(mac, cd);
    }
  }

  let onlineCount = 0;
  let offlineCount = 0;

  for (const dbDevice of dbDevices) {
    if (!dbDevice.mac_address) continue;

    const mac = normalizeMac(dbDevice.mac_address);
    const cloudDev = cloudDeviceMap.get(mac);

    let newStatus = dbDevice.status;
    let lastSeen = dbDevice.last_seen_online ? new Date(dbDevice.last_seen_online) : new Date();
    let lastNotified = dbDevice.last_notified ? new Date(dbDevice.last_notified) : null;
    let needsDbUpdate = false;
    let newAlert = null; // store alert info to insert

    if (cloudDev) {
      const isOnline = (
        cloudDev.status === 'ONLINE' ||
        cloudDev.status === 1 ||
        cloudDev.state === 'ONLINE' ||
        cloudDev.isOnline === true ||
        cloudDev.onlineStatus === 'ON' ||
        cloudDev.onlineStatus === 'ONLINE'
      );

      if (isOnline) {
        if (newStatus !== 'ONLINE') {
          // Device just recovered!
          newAlert = { type: 'RECOVERED', message: `อุปกรณ์กลับมาออนไลน์แล้ว` };
          
          // Also mark all previous unresolved offline alerts as resolved for this device
          await supabase.from('alerts').update({ resolved: true }).eq('device_id', dbDevice.id).eq('resolved', false);
        }
        newStatus = 'ONLINE';
        lastSeen = now;
        needsDbUpdate = true;
        onlineCount++;
      } else {
        newStatus = 'OFFLINE';
        needsDbUpdate = true;
        offlineCount++;
      }
    } else {
      continue;
    }

    if (newStatus === 'OFFLINE') {
      const timeSinceLastSeenMs = now.getTime() - lastSeen.getTime();

      if (timeSinceLastSeenMs > OFFLINE_THRESHOLD_MS) {
        if (!lastNotified || lastNotified < lastSeen) {
          const minutesOffline = Math.floor(timeSinceLastSeenMs / 60000);
          const dateStr = now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' });

          await sendLineOA(dbDevice.name, dbDevice.type, minutesOffline, dateStr);
          lastNotified = now;
          needsDbUpdate = true;
          
          newAlert = { type: 'OFFLINE', message: `ขาดการติดต่อเกิน ${minutesOffline} นาที` };
        }
      }
    }

    if (needsDbUpdate) {
      const { error } = await supabase
        .from('devices')
        .update({
          status: newStatus,
          last_seen_online: lastSeen.toISOString(),
          last_notified: lastNotified ? lastNotified.toISOString() : null
        })
        .eq('id', dbDevice.id);

      if (error) {
        console.error(`❌ Error updating ${dbDevice.name}:`, error.message);
      }
    }

    if (newAlert) {
      const { error: alertError } = await supabase.from('alerts').insert({
        device_id: dbDevice.id,
        type: newAlert.type,
        message: newAlert.message,
        resolved: newAlert.type === 'RECOVERED'
      });
      if (alertError) {
        console.error(`❌ Error inserting alert for ${dbDevice.name}:`, alertError.message);
      }
    }
  }

  console.log(`✅ Sync Complete: ${onlineCount} Online | ${offlineCount} Offline.`);
}

console.log("🚀 Ruijie Monitor Worker Started.");
console.log(`Polling every ${POLL_INTERVAL_MS / 1000} seconds...`);

syncDevicesAndAlert();
setInterval(syncDevicesAndAlert, POLL_INTERVAL_MS);
