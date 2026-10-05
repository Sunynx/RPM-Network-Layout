const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // get connections created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      id,
      created_at,
      from_device:devices!connections_from_device_id_fkey(name),
      to_device:devices!connections_to_device_id_fkey(name)
    `)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${connections.length} connections created today.`);
  const marinaSwitches = ['AB', 'CD', 'E', 'Fueldock', 'M-CD', 'SW-01-Abutment-Right', 'SW-02-Abatment-Left', 'SW-03-Security_Drystack'];
  
  const meshConnections = connections.filter(c => 
    marinaSwitches.includes(c.from_device?.name) && marinaSwitches.includes(c.to_device?.name)
  );

  console.log(`Found ${meshConnections.length} switch-to-switch mesh connections.`);
}

run();
