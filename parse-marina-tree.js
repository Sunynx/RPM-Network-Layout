const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const dirPath = path.join(__dirname, '../Mac excel marina');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx'));
  
  const { data: devices, error } = await supabase.from('devices').select('*');
  if (error) return;

  const portMacCounts = {}; 
  const deviceSeenAt = {}; 

  for (const file of files) {
    let switchName = file.replace('MAC ', '').replace('.xlsx', '').trim();
    let mainSwitch = devices.find(d => 
      (d.name && d.name.toLowerCase() === switchName.toLowerCase()) ||
      (d.alias && d.alias.toLowerCase() === switchName.toLowerCase())
    );
    if (!mainSwitch) {
      mainSwitch = devices.find(d => 
        (d.name && d.name.toLowerCase().includes(switchName.toLowerCase())) ||
        (d.alias && d.alias.toLowerCase().includes(switchName.toLowerCase()))
      );
    }
    if (!mainSwitch) continue;

    const filePath = path.join(dirPath, file);
    const workbook = xlsx.readFile(filePath);
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const portCounts = {};
    const validRows = [];
    for (const row of data) {
      const mac = row['MAC Address'] || row['MAC'] || row['Mac Address'] || row['mac'];
      let port = row['Port'] || row['Interface'] || row['port'];
      if (mac && port) {
         port = port.trim();
         portCounts[port] = (portCounts[port] || 0) + 1;
         validRows.push({ mac, port });
      }
    }

    for (const row of validRows) {
      const normalizedMac = row.mac.toLowerCase().replace(/[^a-f0-9]/g, '');
      const device = devices.find(d => d.mac_address && d.mac_address.toLowerCase().replace(/[^a-f0-9]/g, '') === normalizedMac);
      if (device && device.id !== mainSwitch.id) {
         if (!deviceSeenAt[device.id]) deviceSeenAt[device.id] = [];
         deviceSeenAt[device.id].push({
            switchId: mainSwitch.id,
            switchName: mainSwitch.name,
            port: row.port,
            totalMacsOnPort: portCounts[row.port]
         });
      }
    }
  }

  let successCount = 0;
  for (const [deviceId, seenList] of Object.entries(deviceSeenAt)) {
     seenList.sort((a, b) => a.totalMacsOnPort - b.totalMacsOnPort);
     const bestParent = seenList[0];
     
     const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .eq('from_device_id', bestParent.switchId)
      .eq('to_device_id', deviceId)
      .single();

     if (!existing) {
       const { error: insertError } = await supabase.from('connections').insert({
         from_device_id: bestParent.switchId,
         to_device_id: deviceId,
         source_port_name: bestParent.port,
         target_port_name: 'WAN/Uplink',
         type: 'ETHERNET'
       });
       if (!insertError) successCount++;
     }
  }

  console.log(`Successfully inserted ${successCount} true tree connections.`);
}

run();
