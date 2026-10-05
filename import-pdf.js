const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const devicesData = [
  // Office Project
  { name: 'Switch_Main_Office', type: 'SWITCH', model: 'NBS5100-48GT4SFP', serial_no: 'G1QH3EP00047B', ip_address: '192.168.2.75', pos_x: 200, pos_y: 200 },
  
  // MarinaWIFI Project
  { name: 'SW-01-Abutment-Right', type: 'SWITCH', model: 'ES210GS-P', serial_no: 'G1T04L3002952', ip_address: '192.168.101.41', pos_x: 600, pos_y: 100 },
  { name: 'M-CD', type: 'SWITCH', model: 'NBS3100-8GT2SFP', serial_no: 'CAPL927004149', ip_address: '192.168.101.39', pos_x: 600, pos_y: 300 },
  { name: 'CD', type: 'SWITCH', model: 'ES205GC-P', serial_no: 'CAR3234014659', ip_address: '192.168.101.56', pos_x: 1000, pos_y: 100 },
  { name: 'AB', type: 'SWITCH', model: 'ES205GC-P', serial_no: 'CAR514U00077A', ip_address: '192.168.101.69', pos_x: 1200, pos_y: 100 },
  { name: 'SW-03-Security_Drystack', type: 'SWITCH', model: 'ES210GS-P', serial_no: 'G1T04L3000744', ip_address: '192.168.101.25', pos_x: 1400, pos_y: 100 },
  { name: 'E', type: 'SWITCH', model: 'ES210GS-P', serial_no: 'G1T04L3002716', ip_address: '192.168.101.37', pos_x: 1600, pos_y: 100 },
  { name: 'Fueldock', type: 'SWITCH', model: 'ES220GS-P', serial_no: 'G1U51Z700720B', ip_address: '192.168.101.79', pos_x: 1800, pos_y: 100 },
  { name: 'SW-02-Abatment-Left', type: 'SWITCH', model: 'ES208GC', serial_no: 'ZAT307M011573', ip_address: '192.168.101.43', pos_x: 2000, pos_y: 100 },
  
  { name: 'Unmanaged Switch (1)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-001', pos_x: 1000, pos_y: 300 },
  { name: 'Unmanaged Switch (2)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-002', pos_x: 800, pos_y: 500 },

  { name: 'D4', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1UA28U008575', ip_address: '192.168.101.149', pos_x: 200, pos_y: 500 },
  { name: 'DocA8', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1RP6HJ025609', ip_address: '192.168.101.71', pos_x: 400, pos_y: 500 },
  { name: 'DocD12', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1RP6HJ027226', ip_address: '192.168.101.99', pos_x: 600, pos_y: 500 },
  
  { name: 'Gas', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1SU3LE00960B', ip_address: '192.168.101.140', pos_x: 900, pos_y: 500 },
  { name: 'APGardHouseFront', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1SU3LE017424', ip_address: '192.168.101.29', pos_x: 1100, pos_y: 500 },
  
  { name: 'E7', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1UA28U01487B', ip_address: '192.168.101.125', pos_x: 700, pos_y: 700 },
  { name: 'SalaDorkE', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1RU9HN021784', ip_address: '192.168.101.35', pos_x: 900, pos_y: 700 },
  { name: 'DocE4', type: 'AP', model: 'RAP6262(G)', serial_no: 'G1RU9HN029899', ip_address: '192.168.101.119', pos_x: 1100, pos_y: 700 },
];

const connectionsData = [
  { from: 'G1T04L3002952', to: 'CAPL927004149', sourcePort: 'Port 1', targetPort: 'Gi7' },
  { from: 'G1T04L3002952', to: 'VIRTUAL-001', sourcePort: 'Port 10', targetPort: 'Uplink' },
  { from: 'VIRTUAL-001', to: 'G1SU3LE00960B', sourcePort: 'port1', targetPort: 'WAN' },
  { from: 'VIRTUAL-001', to: 'G1SU3LE017424', sourcePort: 'port2', targetPort: 'WAN' },
  { from: 'CAPL927004149', to: 'G1UA28U008575', sourcePort: 'Gi2', targetPort: 'WAN' },
  { from: 'CAPL927004149', to: 'G1RP6HJ025609', sourcePort: 'Gi4', targetPort: 'WAN' },
  { from: 'CAPL927004149', to: 'G1RP6HJ027226', sourcePort: 'Gi6', targetPort: 'WAN' },
  { from: 'CAPL927004149', to: 'VIRTUAL-002', sourcePort: 'Gi10', targetPort: 'Uplink' },
  { from: 'VIRTUAL-002', to: 'G1UA28U01487B', sourcePort: 'port1', targetPort: 'WAN' },
  { from: 'VIRTUAL-002', to: 'G1RU9HN021784', sourcePort: 'port2', targetPort: 'WAN' },
  { from: 'VIRTUAL-002', to: 'G1RU9HN029899', sourcePort: 'port3', targetPort: 'WAN' }
];

async function run() {
  console.log("🚀 Starting PDF Data Import...");

  const deviceIdMap = {};

  // Upsert Devices
  for (const dev of devicesData) {
    const { data: existing } = await supabase.from('devices').select('id').eq('serial_no', dev.serial_no).single();
    
    if (existing) {
      console.log(`✅ Device already exists: ${dev.name}`);
      deviceIdMap[dev.serial_no] = existing.id;
    } else {
      const { data, error } = await supabase.from('devices').insert([dev]).select('id').single();
      if (error) {
        console.error(`❌ Error creating ${dev.name}:`, error.message);
      } else {
        console.log(`✅ Created device: ${dev.name}`);
        deviceIdMap[dev.serial_no] = data.id;
      }
    }
  }

  // Create Connections
  for (const conn of connectionsData) {
    const fromId = deviceIdMap[conn.from];
    const toId = deviceIdMap[conn.to];

    if (!fromId || !toId) {
      console.warn(`⚠️ Skipping connection: Could not find IDs for ${conn.from} -> ${conn.to}`);
      continue;
    }

    // Check if connection already exists
    const { data: existingConn } = await supabase
      .from('connections')
      .select('id')
      .eq('from_device_id', fromId)
      .eq('to_device_id', toId)
      .single();

    if (existingConn) {
      console.log(`✅ Connection already exists: ${conn.from} -> ${conn.to}`);
      continue;
    }

    const { error } = await supabase.from('connections').insert({
      from_device_id: fromId,
      to_device_id: toId,
      source_port_name: conn.sourcePort,
      target_port_name: conn.targetPort,
      type: 'ETHERNET'
    });

    if (error) {
      console.error(`❌ Error creating connection: ${conn.from} -> ${conn.to}:`, error.message);
    } else {
      console.log(`✅ Created connection: ${conn.sourcePort} -> ${conn.targetPort}`);
    }
  }

  console.log("🎉 PDF Data Import Completed!");
}

run();
