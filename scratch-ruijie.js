const appId = "open76762d2cfb05";
const secret = "dacab1acf94048b1b8379428359d551d";
const cloudUrl = "https://cloud-as.ruijienetworks.com";

async function run() {
  const tokenRes = await fetch(`${cloudUrl}/service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appid: appId, secret: secret }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token || tokenData.accessToken;
  
  if (!accessToken) {
    console.error("No access token", tokenData);
    return;
  }

  const groupRes = await fetch(`${cloudUrl}/service/api/group/single/tree?depth=BUILDING&access_token=${accessToken}`);
  const groupData = await groupRes.json();
  
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
  
  const targetGroupId = findFirstGroupId(groupData);
  if (!targetGroupId) {
    console.error("No group id found");
    return;
  }
  
  console.log("Fetching devices for group", targetGroupId);
  const devRes = await fetch(`${cloudUrl}/service/api/maint/devices?access_token=${accessToken}&group_id=${targetGroupId}&page=0&per_page=10`);
  const devData = await devRes.json();
  
  const list = devData.deviceList || devData.data?.deviceList || devData.data || devData.result || [];
  console.log(`Found ${list.length} devices.`);
  if (list.length > 0) {
    console.log("Sample device fields:", Object.keys(list[0]));
    const macs = list.map(d => d.mac || d.macAddress);
    console.log("A few devices:", list.map(d => ({ 
      mac: d.mac || d.macAddress, 
      uplinkMac: d.uplinkMac, 
      upMac: d.upMac,
      uplinkDevice: d.uplinkDevice,
      parentId: d.parentId,
      uplinkPort: d.uplinkPort,
      connectedTo: d.connectedTo,
      sysUplinkMac: d.sysUplinkMac,
      uplink_mac: d.uplink_mac
    })));
  }
}

run().catch(console.error);
