const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const filePath = '../MAC_RPM_OfficeProject.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  // Get all devices
  const { data: devices, error } = await supabase.from('devices').select('*');
  if (error) {
    console.error("Failed to fetch devices:", error);
    return;
  }

  // Find Switch_Main_Office
  const mainSwitch = devices.find(d => d.serial_no === 'G1QH3EP00047B');
  if (!mainSwitch) {
    console.error("❌ Could not find Switch_Main_Office in DB.");
    return;
  }

  const matchesToInsert = [];

  for (const row of data) {
    const mac = row['MAC Address'] || row['MAC'] || row['Mac Address'] || row['mac'];
    const port = row['Port'] || row['Interface'] || row['port'];

    if (mac && port) {
      const normalizedMac = mac.toLowerCase().replace(/[^a-f0-9]/g, '');
      const device = devices.find(d => d.mac_address && d.mac_address.toLowerCase().replace(/[^a-f0-9]/g, '') === normalizedMac);
      if (device) {
        // Exclude AP-CHEF-OFFICE (as per plan)
        if (device.name === 'AP-CHEF-OFFICE') {
          console.log(`⏩ Skipping AP-CHEF-OFFICE to allow manual routing through Switch Bluu-Solavita.`);
          continue;
        }

        matchesToInsert.push({
          port,
          device
        });
      }
    }
  }

  for (const match of matchesToInsert) {
    console.log(`🔌 Creating connection: ${mainSwitch.name} (${match.port}) -> ${match.device.name}`);
    
    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .eq('from_device_id', mainSwitch.id)
      .eq('to_device_id', match.device.id)
      .single();

    if (existing) {
      console.log(`✅ Connection already exists.`);
      continue;
    }

    const { error: insertError } = await supabase.from('connections').insert({
      from_device_id: mainSwitch.id,
      to_device_id: match.device.id,
      source_port_name: match.port,
      target_port_name: 'Uplink',
      type: 'ETHERNET'
    });

    if (insertError) {
      console.error(`❌ Error inserting connection:`, insertError.message);
    } else {
      console.log(`✅ Connection created successfully.`);
    }
  }

  console.log("🎉 Import completed!");
}

run();
