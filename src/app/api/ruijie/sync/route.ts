import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const appId = process.env.RUIJIE_APP_ID;
    const secret = process.env.RUIJIE_SECRET_KEY;
    const username = process.env.RUIJIE_USERNAME;
    const password = process.env.RUIJIE_PASSWORD;
    const groupId = process.env.RUIJIE_GROUP_ID;
    const cloudUrl = process.env.RUIJIE_CLOUD_URL;

    if (!appId || !secret || !cloudUrl) {
      return NextResponse.json({ error: "Missing Ruijie Cloud credentials in environment" }, { status: 500 });
    }

    console.log("Fetching Ruijie Cloud Access Token...");
    
    // 1. Get Access Token (According to API Reference Manual V2.0.3)
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
      const err = await tokenRes.text();
      throw new Error(`Failed to get access token: ${tokenRes.status} ${err}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token || tokenData.accessToken || tokenData.data?.access_token || tokenData.data?.accessToken;
    if (!accessToken) {
      throw new Error("No access_token found in response: " + JSON.stringify(tokenData));
    }

    let targetGroupId = groupId;
    
    // If groupId is not provided or is the default placeholder, fetch the tree to find it automatically
    if (!targetGroupId || targetGroupId === "your_network_group_id") {
      console.log("Group ID not specified. Fetching group tree to auto-detect...");
      const groupRes = await fetch(`${cloudUrl}/service/api/group/single/tree?depth=BUILDING&access_token=${accessToken}`, {
        method: "GET"
      });
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        console.log("Group Tree:", JSON.stringify(groupData).substring(0, 500));
        
        // Find the first groupId in the response
        // Usually it's in groupData.groups[0] or similar. We will do a deep search.
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
        if (!targetGroupId) {
          throw new Error("Could not automatically detect a Group ID from your Ruijie account. Please specify RUIJIE_GROUP_ID in .env.local.");
        }
        console.log(`Auto-detected Group ID: ${targetGroupId}`);
      } else {
        throw new Error("Failed to fetch group tree to auto-detect Group ID.");
      }
    }

    console.log(`Fetching Ruijie Devices for Group ID: ${targetGroupId}...`);
    
    // 2. Get Device List
    // According to Ruijie Docs: GET /service/api/maint/devices?access_token=...&group_id=...&page=0&per_page=100
    // Note the parameter is group_id (snake_case) not groupId!
    const devUrl = `${cloudUrl}/service/api/maint/devices?access_token=${accessToken}&group_id=${targetGroupId}&page=0&per_page=100`;
    let devRes = await fetch(devUrl, { method: "GET" });
    let devData = null;

    if (devRes.ok) {
      devData = await devRes.clone().json();
      if (devData.code === 21) {
        console.log("Got code 21 (Parameter groupId is null), trying camelCase groupId with pagination just in case...");
        devRes = await fetch(`${cloudUrl}/service/api/maint/devices?access_token=${accessToken}&groupId=${targetGroupId}&page=0&per_page=100`, { method: "GET" });
        devData = await devRes.json();
      }
    }

    if (!devRes.ok || !devData || devData.code !== 0) {
      throw new Error(`Failed to fetch devices. Last response: ${JSON.stringify(devData || await devRes.text())}`);
    }

    console.log("Ruijie Device Response:", JSON.stringify(devData).substring(0, 500));
    
    // The devices are typically in devData.deviceList or devData.data
    let devicesArray: any[] = [];
    if (Array.isArray(devData.deviceList)) devicesArray = devData.deviceList;
    else if (devData.data && Array.isArray(devData.data.deviceList)) devicesArray = devData.data.deviceList;
    else if (Array.isArray(devData.data)) devicesArray = devData.data;
    else if (Array.isArray(devData)) devicesArray = devData;
    else if (Array.isArray(devData.result)) devicesArray = devData.result;
    else if (Array.isArray(devData.content)) devicesArray = devData.content;
    else if (devData.data && Array.isArray(devData.data.result)) devicesArray = devData.data.result;
    
    if (!devicesArray || devicesArray.length === 0) {
      console.log("No devices found or unrecognized format. Data:", devData);
      return NextResponse.json({ 
        success: true,
        updated: 0, 
        inserted: 0, 
        total: 0,
        message: "No devices found or unrecognized format", 
        debugData: devData 
      });
    }

    // 3. Update Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let updatedCount = 0;
    let insertedCount = 0;

    // Get current devices
    const { data: existingDevices } = await supabase.from("devices").select("id, mac_address, name");

    for (const rjDev of devicesArray) {
      // Common fields in Ruijie response
      const rawMac = rjDev.mac || rjDev.macAddress;
      if (!rawMac) continue;
      
      // Clean and format MAC to AA:BB:CC:DD:EE:FF
      const cleanMac = rawMac.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
      const mac = cleanMac.match(/.{1,2}/g)?.join(":") || rawMac;

      const name = rjDev.aliasName || rjDev.name || rjDev.hostName || `Ruijie-${mac}`;
      const ip = rjDev.localIp || rjDev.cpeIp || rjDev.ip || rjDev.ipAddress || null;
      const status = rjDev.onlineStatus === "ON" || rjDev.status === "ONLINE" || rjDev.online ? "ONLINE" : "OFFLINE";
      // Type matching
      let type = "AP";
      const rjType = (rjDev.commonType || rjDev.type || rjDev.productType || "").toUpperCase();
      if (rjType.includes("SW") || rjType.includes("SWITCH")) type = "SWITCH";
      if (rjType.includes("GW") || rjType.includes("GATEWAY") || rjType.includes("ROUTER")) type = "ROUTER";

      const model = rjDev.model || rjDev.modelName || rjDev.devModel || rjDev.hardwareModel || rjDev.productClass || rjDev.sku || null;
      const serial_no = rjDev.sn || rjDev.serialNumber || rjDev.serialNo || null;

      const existing = existingDevices?.find(d => d.mac_address?.toLowerCase() === mac.toLowerCase());

      if (existing) {
        // Update
        const { error: updateError } = await supabase.from("devices").update({
          status,
          ip_address: ip,
          model: model || undefined, // only update if available, or maybe overwrite? Let's just overwrite if present
          ...(model && { model }),
          ...(serial_no && { serial_no }),
        }).eq("id", existing.id);
        
        if (updateError) {
          console.error("Update error for", mac, updateError);
        } else {
          updatedCount++;
        }
      } else {
        // Insert
        const { error: insertError } = await supabase.from("devices").insert({
          name,
          mac_address: mac,
          ip_address: ip,
          type,
          status,
          brand: "Ruijie", // DB schema uses 'brand', not 'vendor'
          model,
          serial_no,
        });
        
        if (insertError) {
          console.error("Insert error for", mac, insertError);
        } else {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      inserted: insertedCount,
      total: devicesArray.length,
    });

  } catch (error: unknown) {
    console.error("Ruijie Sync Error:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
