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

  const plan = {};
  const connectionsToInsert = [];

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
    
    // Group by port
    const portGroups = {};

    for (const row of data) {
      const mac = row['MAC Address'] || row['MAC'] || row['Mac Address'] || row['mac'];
      let port = row['Port'] || row['Interface'] || row['port'];

      if (mac && port) {
        // Fix weird spacing in port string (e.g., " Gi1/0/1 ")
        port = port.trim();
        const normalizedMac = mac.toLowerCase().replace(/[^a-f0-9]/g, '');
        const device = devices.find(d => d.mac_address && d.mac_address.toLowerCase().replace(/[^a-f0-9]/g, '') === normalizedMac);
        if (device && device.id !== mainSwitch.id) {
          if (!portGroups[port]) portGroups[port] = [];
          if (!portGroups[port].some(d => d.id === device.id)) {
            portGroups[port].push(device);
          }
        }
      }
    }

    plan[mainSwitch.name] = [];

    // Apply heuristic
    for (const [port, devs] of Object.entries(portGroups)) {
      const networkNodes = devs.filter(d => d.name.toLowerCase().includes('sw') || d.type === 'SWITCH' || d.type === 'GATEWAY');
      
      let targets = devs;
      if (networkNodes.length > 0) {
        targets = networkNodes;
      }

      for (const t of targets) {
        plan[mainSwitch.name].push({ port, target: t.name, targetType: t.type });
        connectionsToInsert.push({
          from_device_id: mainSwitch.id,
          to_device_id: t.id,
          source_port_name: port,
          target_port_name: 'WAN/Uplink',
          type: 'ETHERNET' // Assuming copper
        });
      }
    }
  }

  console.log(`🚀 Starting Bulk Database Inserts. Inserting ${connectionsToInsert.length} connections...`);
  let successCount = 0;

  for (const conn of connectionsToInsert) {
    // Check existing
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .eq('from_device_id', conn.from_device_id)
      .eq('to_device_id', conn.to_device_id)
      .single();

    if (existing) {
      console.log(`✅ Connection already exists: ${conn.source_port_name}`);
      continue;
    }

    const { error: insertError } = await supabase.from('connections').insert(conn);
    if (insertError) {
      console.error(`❌ Error inserting connection on port ${conn.source_port_name}:`, insertError.message);
    } else {
      console.log(`✅ Inserted connection on port ${conn.source_port_name}`);
      successCount++;
    }
  }

  console.log(`🎉 Finished! Successfully inserted ${successCount} new connections.`);
}

run();
