const appId = "open76762d2cfb05";
const secret = "dacab1acf94048b1b8379428359d551d";
const cloudUrl = "https://cloud-as.ruijienetworks.com";

async function run() {
  const tokenRes = await fetch(`${cloudUrl}/service/api/oauth20/client/access_token?token=d63dss0a81e4415a889ac5b78fsc904a`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appid: appId, secret: secret }),
  });
  const accessToken = (await tokenRes.json()).access_token;
  
  const targetGroupId = 572452; // from previous output
  
  const endpoints = [
    `/service/api/maint/topology?groupId=${targetGroupId}`,
    `/service/api/maint/topology/tree?groupId=${targetGroupId}`,
    `/service/api/network/topology?groupId=${targetGroupId}`,
    `/service/api/device/topology?groupId=${targetGroupId}`
  ];
  
  for (const ep of endpoints) {
    console.log("Trying", ep);
    const res = await fetch(`${cloudUrl}${ep}&access_token=${accessToken}`);
    const data = await res.json();
    console.log(data);
  }
}
run().catch(console.error);
