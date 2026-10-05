const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      id,
      from_device_id,
      from_device:devices!connections_from_device_id_fkey(name)
    `)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error(error);
    return;
  }
  
  const marinaSwitches = ['AB', 'CD', 'E', 'Fueldock', 'M-CD', 'SW-01-Abutment-Right', 'SW-02-Abatment-Left', 'SW-03-Security_Drystack'];
  
  const idsToDelete = connections
    .filter(c => marinaSwitches.includes(c.from_device?.name))
    .map(c => c.id);

  if (idsToDelete.length > 0) {
    console.log(`Deleting ${idsToDelete.length} bad mesh connections...`);
    const { error: delError } = await supabase.from('connections').delete().in('id', idsToDelete);
    if (delError) console.error(delError);
    else console.log('Successfully deleted!');
  } else {
    console.log('No mesh connections found to delete.');
  }
}

run();
