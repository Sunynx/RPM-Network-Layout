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
  if (error) {
    console.error("Failed to fetch devices:", error);
    return;
  }

  let totalMatches = 0;
  const plan = {};

  for (const file of files) {
    // Determine switch name from filename (e.g., "MAC AB.xlsx" -> "AB", "MAC SW-01-Abutment-Right.xlsx" -> "SW-01-Abutment-Right")
    let switchName = file.replace('MAC ', '').replace('.xlsx', '').trim();
    
    // Attempt to find the switch in DB by name/alias
    // Exact match or contains
    let mainSwitch = devices.find(d => 
      (d.name && d.name.toLowerCase() === switchName.toLowerCase()) ||
      (d.alias && d.alias.toLowerCase() === switchName.toLowerCase())
    );

    // If not found exactly, try partial match (like 'M-CD' instead of 'MAC M-CD')
    if (!mainSwitch) {
      mainSwitch = devices.find(d => 
        (d.name && d.name.toLowerCase().includes(switchName.toLowerCase())) ||
        (d.alias && d.alias.toLowerCase().includes(switchName.toLowerCase()))
      );
    }

    if (!mainSwitch) {
      console.log(`⚠️ Warning: Could not find switch for file ${file} (Search term: ${switchName})`);
      continue;
    }

    const filePath = path.join(dirPath, file);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    plan[mainSwitch.name] = [];

    for (const row of data) {
      const mac = row['MAC Address'] || row['MAC'] || row['Mac Address'] || row['mac'];
      const port = row['Port'] || row['Interface'] || row['port'];

      if (mac && port) {
        const normalizedMac = mac.toLowerCase().replace(/[^a-f0-9]/g, '');
        const device = devices.find(d => d.mac_address && d.mac_address.toLowerCase().replace(/[^a-f0-9]/g, '') === normalizedMac);
        if (device && device.id !== mainSwitch.id) { // Don't connect to itself
          plan[mainSwitch.name].push({ port, target: device.name, targetMac: device.mac_address });
          totalMatches++;
        }
      }
    }
  }

  console.log("=== PROPOSED CONNECTIONS ===");
  for (const [swName, connections] of Object.entries(plan)) {
    if (connections.length > 0) {
      console.log(`Switch: ${swName}`);
      for (const c of connections) {
        console.log(`  - Port ${c.port} -> ${c.target} (${c.targetMac})`);
      }
    }
  }
  console.log(`Total Matches: ${totalMatches}`);
}

run();
