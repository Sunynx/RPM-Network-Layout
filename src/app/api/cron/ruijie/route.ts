import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    // Vercel Cron Authentication
    // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appId = process.env.RUIJIE_APP_ID;
    const secret = process.env.RUIJIE_SECRET_KEY;
    const groupId = process.env.RUIJIE_GROUP_ID;
    const cloudUrl = process.env.RUIJIE_CLOUD_URL;

    if (!appId || !secret || !cloudUrl) {
      return NextResponse.json({ error: "Missing Ruijie Cloud credentials in environment" }, { status: 500 });
    }

    console.log("[CRON] Fetching Ruijie Cloud Access Token...");
    
    const tokenRes = await fetch(`${cloudUrl}/service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appid: appId,
        secret: secret
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Failed to get access token: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token || tokenData.accessToken || tokenData.data?.access_token || tokenData.data?.accessToken;
    if (!accessToken) {
      throw new Error("No access_token found in response");
    }

    let targetGroupId = groupId;
    
    if (!targetGroupId || targetGroupId === "your_network_group_id") {
      const groupRes = await fetch(`${cloudUrl}/service/api/group/single/tree?depth=BUILDING&access_token=${accessToken}`, {
        method: "GET"
      });
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        
        const findFirstGroupId = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.groupId) return obj.groupId;
          if (obj.id && obj.type === "BUILDING") return obj.id;
          
          for (const key of Object.keys(obj)) {
            const found = findFirstGroupId(obj[key]);
            if (found) return found;
          }
          return null;
        };
        
        targetGroupId = findFirstGroupId(groupData) || undefined;
      }
    }

    if (!targetGroupId) {
       throw new Error("Could not detect Group ID");
    }

    console.log(`[CRON] Fetching Ruijie Devices for Group ID: ${targetGroupId}...`);
    
    const devUrl = `${cloudUrl}/service/api/maint/devices?access_token=${accessToken}&group_id=${targetGroupId}&page=0&per_page=100`;
    let devRes = await fetch(devUrl, { method: "GET" });
    let devData = null;

    if (devRes.ok) {
      devData = await devRes.clone().json();
      if (devData.code === 21) {
        devRes = await fetch(`${cloudUrl}/service/api/maint/devices?access_token=${accessToken}&groupId=${targetGroupId}&page=0&per_page=100`, { method: "GET" });
        devData = await devRes.json();
      }
    }

    if (!devRes.ok || !devData || devData.code !== 0) {
      throw new Error(`Failed to fetch devices`);
    }

    let devicesArray: any[] = [];
    if (Array.isArray(devData.deviceList)) devicesArray = devData.deviceList;
    else if (devData.data && Array.isArray(devData.data.deviceList)) devicesArray = devData.data.deviceList;
    else if (Array.isArray(devData.data)) devicesArray = devData.data;
    else if (Array.isArray(devData)) devicesArray = devData;
    else if (Array.isArray(devData.result)) devicesArray = devData.result;
    else if (Array.isArray(devData.content)) devicesArray = devData.content;
    else if (devData.data && Array.isArray(devData.data.result)) devicesArray = devData.data.result;
    
    if (!devicesArray || devicesArray.length === 0) {
      return NextResponse.json({ success: true, message: "No devices found" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    // Use service role key if available for cron jobs to bypass RLS, otherwise anon key
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

    let updatedCount = 0;
    let insertedCount = 0;
    let offlineAlerts = 0;

    // Get current devices
    const { data: existingDevices } = await supabase.from("devices").select("id, mac_address, name, status");

    for (const rjDev of devicesArray) {
      const rawMac = rjDev.mac || rjDev.macAddress;
      if (!rawMac) continue;
      
      const cleanMac = rawMac.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
      const mac = cleanMac.match(/.{1,2}/g)?.join(":") || rawMac;

      const name = rjDev.aliasName || rjDev.name || rjDev.hostName || `Ruijie-${mac}`;
      const ip = rjDev.localIp || rjDev.cpeIp || rjDev.ip || rjDev.ipAddress || null;
      const status = rjDev.onlineStatus === "ON" || rjDev.status === "ONLINE" || rjDev.online ? "ONLINE" : "OFFLINE";
      
      let type = "AP";
      const rjType = (rjDev.commonType || rjDev.type || rjDev.productType || "").toUpperCase();
      if (rjType.includes("SW") || rjType.includes("SWITCH")) type = "SWITCH";
      if (rjType.includes("GW") || rjType.includes("GATEWAY") || rjType.includes("ROUTER")) type = "ROUTER";

      const model = rjDev.model || rjDev.modelName || rjDev.devModel || rjDev.hardwareModel || rjDev.productClass || rjDev.sku || null;
      const serial_no = rjDev.sn || rjDev.serialNumber || rjDev.serialNo || null;

      const existing = existingDevices?.find(d => d.mac_address?.toLowerCase() === mac.toLowerCase());

      if (existing) {
        // Create Alert if status changed
        if (existing.status === "ONLINE" && status === "OFFLINE") {
          await supabase.from("alerts").insert({
            device_id: existing.id,
            type: "OFFLINE",
            message: `อุปกรณ์ ${name} ดับหรือขาดการเชื่อมต่อ (ตรวจพบโดย Cron Job)`,
            resolved: false
          });
          offlineAlerts++;
        }
        if (existing.status === "OFFLINE" && status === "ONLINE") {
          await supabase.from("alerts").update({ resolved: true }).eq("device_id", existing.id).eq("resolved", false);
          await supabase.from("alerts").insert({
            device_id: existing.id,
            type: "RECOVERED",
            message: `อุปกรณ์ ${name} กลับมาออนไลน์แล้ว`,
            resolved: true
          });
        }

        // Update
        const { error: updateError } = await supabase.from("devices").update({
          status,
          ip_address: ip,
          model: model || undefined,
          ...(model && { model }),
          ...(serial_no && { serial_no }),
        }).eq("id", existing.id);
        
        if (!updateError) updatedCount++;
      } else {
        // Insert
        const { error: insertError } = await supabase.from("devices").insert({
          name,
          mac_address: mac,
          ip_address: ip,
          type,
          status,
          brand: "Ruijie",
          model,
          serial_no,
        });
        
        if (!insertError) insertedCount++;
      }
    }

    // Log the sync activity so the frontend can know the last sync time
    await supabase.from("activity_logs").insert({
      action: "SYNC",
      entity_type: "DEVICE",
      entity_name: "Ruijie Auto Sync (Cron)",
      details: {
        updated: updatedCount,
        inserted: insertedCount,
        offline_alerts_generated: offlineAlerts,
        total: devicesArray.length,
      }
    });

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      inserted: insertedCount,
      offline_alerts_generated: offlineAlerts,
      total: devicesArray.length,
    });

  } catch (error: unknown) {
    console.error("[CRON] Ruijie Sync Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
