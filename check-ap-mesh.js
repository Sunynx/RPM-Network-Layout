const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      id,
      from_device_id,
      to_device_id,
      to_device:devices!connections_to_device_id_fkey(name, type)
    `);

  if (error) {
    console.error(error);
    return;
  }
  
  const targetCounts = {};
  for (const c of connections) {
    if (c.to_device?.type === 'AP') {
       targetCounts[c.to_device_id] = (targetCounts[c.to_device_id] || 0) + 1;
    }
  }

  let multiConnAPs = 0;
  for (const [id, count] of Object.entries(targetCounts)) {
    if (count > 1) {
       multiConnAPs++;
       // console.log(`AP ${id} has ${count} incoming connections.`);
    }
  }
  
  console.log(`Found ${multiConnAPs} APs that are connected to MULTIPLE switches!`);
}

run();
