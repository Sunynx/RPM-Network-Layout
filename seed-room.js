import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  console.log("Checking for sites...");
  let { data: sites } = await supabase.from("sites").select("*");
  let siteId = sites?.[0]?.id;
  
  if (!siteId) {
    console.log("Creating default site...");
    const { data } = await supabase.from("sites").insert([{ name: "HQ", location: "Main Building" }]).select();
    siteId = data?.[0]?.id;
  }
  
  console.log("Checking for floors...");
  let { data: floors } = await supabase.from("floors").select("*");
  let floorId = floors?.[0]?.id;
  
  if (!floorId) {
    console.log("Creating default floor...");
    const { data } = await supabase.from("floors").insert([{ name: "Ground Floor", site_id: siteId }]).select();
    floorId = data?.[0]?.id;
  }
  
  console.log("Checking for rooms...");
  let { data: rooms } = await supabase.from("rooms").select("*");
  let roomId = rooms?.[0]?.id;
  
  if (!roomId) {
    console.log("Creating default room...");
    const { data } = await supabase.from("rooms").insert([{ name: "Main Server Room", type: "SERVER_ROOM", floor_id: floorId }]).select();
    roomId = data?.[0]?.id;
  }
  
  console.log("Default Room ID:", roomId);
}

seed().catch(console.error);
