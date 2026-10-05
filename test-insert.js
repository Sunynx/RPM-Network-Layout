import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load env vars manually
const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function testInsert() {
  console.log("Checking rooms...");
  let { data: rooms, error: err1 } = await supabase.from("rooms").select("id").limit(1);
  if (err1) console.error("Err1", err1);
  
  let roomId = rooms?.[0]?.id;
  
  if (!roomId) {
    console.log("No room, creating site...");
    const resSite = await supabase.from("sites").insert([{ name: "HQ" }]).select();
    if (resSite.error) console.error("Site Error:", resSite.error);
    const siteId = resSite.data?.[0]?.id;
    
    console.log("Creating floor...");
    const resFloor = await supabase.from("floors").insert([{ name: "Ground Floor", site_id: siteId }]).select();
    if (resFloor.error) console.error("Floor Error:", resFloor.error);
    const floorId = resFloor.data?.[0]?.id;
    
    console.log("Creating room...");
    const resRoom = await supabase.from("rooms").insert([{ name: "Main Server Room", type: "SERVER_ROOM", floor_id: floorId }]).select();
    if (resRoom.error) console.error("Room Error:", resRoom.error);
    roomId = resRoom.data?.[0]?.id;
  }

  console.log("Inserting rack with roomId:", roomId);
  const resRack = await supabase.from("racks").insert([{
    name: "Test Rack",
    total_units: 42,
    room_id: roomId
  }]);
  
  if (resRack.error) {
    console.error("Rack Error:", resRack.error);
  } else {
    console.log("Rack inserted successfully!");
  }
}

testInsert().catch(console.error);
