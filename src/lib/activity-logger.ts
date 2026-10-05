import { createClient } from "./supabase/client";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE" | "SYNC";
export type ActivityEntity = "DEVICE" | "CONNECTION" | "VLAN" | "TOPOLOGY";

export async function logActivity(
  action: ActivityAction,
  entity_type: ActivityEntity,
  entity_name: string,
  entity_id?: string | null,
  details?: any
) {
  try {
    const supabase = createClient();
    await supabase.from("activity_logs").insert({
      action,
      entity_type,
      entity_name,
      entity_id: entity_id || null,
      details: details || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
