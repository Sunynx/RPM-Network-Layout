const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const devicesToCreate = [
  { name: 'Unmanaged Hub (MC46B)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-MC46B', pos_x: 200, pos_y: 1000 },
  { name: 'Unmanaged Hub (MC21B)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-MC21B', pos_x: 400, pos_y: 1000 },
  { name: 'Unmanaged Hub (Lounge)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-MEMBER-LOUNGE', pos_x: 600, pos_y: 1000 },
  { name: 'Unmanaged Hub (Chef)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-OFFICE-CHEF', pos_x: 800, pos_y: 1000 },
  { name: 'Unmanaged Hub (RPMOffice)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-RPMOFFICE', pos_x: 1000, pos_y: 1000 },
  { name: 'Unmanaged Hub (WifiTV)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-RPMWIFITV', pos_x: 1200, pos_y: 1000 },
  { name: 'Unmanaged Hub (Waterfront)', type: 'SWITCH', model: 'Virtual', serial_no: 'VIRTUAL-WATERFRONT', pos_x: 1400, pos_y: 1000 },
];

const connectionsData = [
  // Grands villaProject
  { fromSN: 'CAR3234010154', toSN: 'ZASB0CX012115', sPort: 'Port 2', tPort: 'WAN' }, // SW_bedroom_Grands villa -> Ap12345
  { fromSN: 'CAR3234010154', toSN: 'G1RUBHN021794', sPort: 'Port 3', tPort: 'WAN' }, // SW_bedroom_Grands villa -> Pool3

  // SOLAVITA-BLUUProject
  { fromSN: 'G1U60HR002874', toSN: 'G1U825B028304', sPort: 'Port 1', tPort: 'WAN' }, // Switch Bluu-Solavita -> AP-SOLAVITA1
  { fromSN: 'G1U60HR002874', toSN: 'G1U825B030907', sPort: 'Port 2', tPort: 'WAN' }, // Switch Bluu-Solavita -> AP-SOLAVITA2
  { fromSN: 'G1U60HR002874', toSN: 'G1U825B029406', sPort: 'Port 3', tPort: 'WAN' }, // Switch Bluu-Solavita -> AP-BLUU1
  { fromSN: 'G1U60HR002874', toSN: 'G1U825B010868', sPort: 'Port 4', tPort: 'WAN' }, // Switch Bluu-Solavita -> AP-BLUU2

  // Villa5Project
  { fromSN: 'G1PHCEL00693B', toSN: 'G1QP71A080343', sPort: 'Port 9', tPort: 'WAN' }, // Sw_main_villa5 -> BedRoom_F2_Pool-villa5

  // Virtual Hubs
  // MC46BProject
  { fromSN: 'VIRTUAL-MC46B', toSN: 'G1TK4NG00240A', sPort: 'port1', tPort: 'WAN' }, // Mc46bf2
  { fromSN: 'VIRTUAL-MC46B', toSN: 'G1TK4NG013364', sPort: 'port2', tPort: 'WAN' }, // Livingroom-MC46B

  // Mc21BProject
  { fromSN: 'VIRTUAL-MC21B', toSN: 'G1SK5QB001362', sPort: 'port1', tPort: 'WAN' }, // Ruijie (M32)
  { fromSN: 'VIRTUAL-MC21B', toSN: 'G1SK5QB003591', sPort: 'port2', tPort: 'WAN' }, // AP-MC21B

  // RPM Member Lounge
  { fromSN: 'VIRTUAL-MEMBER-LOUNGE', toSN: 'G1U51TS009899', sPort: 'port1', tPort: 'WAN' }, // AP-Member Lounge

  // RPM-OFFICE-CHEF
  { fromSN: 'VIRTUAL-OFFICE-CHEF', toSN: 'G1RP6P8085998', sPort: 'port1', tPort: 'WAN' }, // AP-CHEF-OFFICE

  // RPMOffice
  { fromSN: 'VIRTUAL-RPMOFFICE', toSN: 'G1QHCJD000317', sPort: 'port1', tPort: 'WAN' }, // WIFI-Marina
  { fromSN: 'VIRTUAL-RPMOFFICE', toSN: 'G1TK4NG018321', sPort: 'port2', tPort: 'WAN' }, // WIFI-Admin

  // RPMwifiTV
  { fromSN: 'VIRTUAL-RPMWIFITV', toSN: 'G1T0ACP01427C', sPort: 'port1', tPort: 'WAN' }, // TvMC3
  { fromSN: 'VIRTUAL-RPMWIFITV', toSN: 'G1T0ACP019340', sPort: 'port2', tPort: 'WAN' }, // TvAbatment

  // THE WATERFRONT
  { fromSN: 'VIRTUAL-WATERFRONT', toSN: 'G1U40S8003949', sPort: 'port1', tPort: 'WAN' }, // AP-THE WATERFRONT_2
  { fromSN: 'VIRTUAL-WATERFRONT', toSN: 'G1U5292000045', sPort: 'port2', tPort: 'WAN' }, // AP-THE WATERFRONT_1
];

async function run() {
  console.log("🚀 Starting Bulk PDF Connections Import...");

  const deviceIdMap = {};

  // 1. Upsert Virtual Devices
  for (const dev of devicesToCreate) {
    const { data: existing } = await supabase.from('devices').select('id').eq('serial_no', dev.serial_no).single();
    if (existing) {
      deviceIdMap[dev.serial_no] = existing.id;
    } else {
      const { data, error } = await supabase.from('devices').insert([dev]).select('id').single();
      if (error) {
        console.error(`❌ Error creating virtual device ${dev.name}:`, error.message);
      } else {
        deviceIdMap[dev.serial_no] = data.id;
      }
    }
  }

  // 2. Fetch existing devices to map serial_no to ID
  const { data: allDevices, error } = await supabase.from('devices').select('id, serial_no, name');
  if (error) {
    console.error("❌ Failed to fetch devices:", error.message);
    return;
  }

  for (const d of allDevices) {
    deviceIdMap[d.serial_no] = d.id;
  }

  // 3. Create Connections
  for (const conn of connectionsData) {
    const fromId = deviceIdMap[conn.fromSN];
    const toId = deviceIdMap[conn.toSN];

    if (!fromId || !toId) {
      console.warn(`⚠️ Warning: Could not find IDs for SN: ${conn.fromSN} -> ${conn.toSN}. Maybe device doesn't exist?`);
      continue;
    }

    const { data: existingConn } = await supabase
      .from('connections')
      .select('id')
      .eq('from_device_id', fromId)
      .eq('to_device_id', toId)
      .single();

    if (existingConn) {
      console.log(`✅ Connection already exists: ${conn.fromSN} -> ${conn.toSN}`);
      continue;
    }

    const { error: insertError } = await supabase.from('connections').insert({
      from_device_id: fromId,
      to_device_id: toId,
      source_port_name: conn.sPort,
      target_port_name: conn.tPort,
      type: 'ETHERNET'
    });

    if (insertError) {
      console.error(`❌ Error inserting connection:`, insertError.message);
    } else {
      console.log(`✅ Connection created successfully: ${conn.sPort} -> ${conn.tPort}`);
    }
  }

  console.log("🎉 Bulk Import completed!");
}

run();
