export type DeviceType = "ROUTER" | "SWITCH" | "FIREWALL" | "SERVER" | "AP" | "PATCH_PANEL" | "UPS" | "MEDIA_CONVERTER";
export type DeviceStatus = "ONLINE" | "OFFLINE" | "WARNING" | "MAINTENANCE";
export type PortType = "ETHERNET" | "FIBER" | "CONSOLE" | "SFP";
export type PortStatus = "UP" | "DOWN" | "DISABLED";
export type ConnectionType = "ETHERNET" | "FIBER" | "WIRELESS";
export type RoomType = "SERVER_ROOM" | "OFFICE" | "MDF" | "IDF";

export interface Site {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Floor {
  id: string;
  name: string;
  site_id: string;
  site?: Site;
  rooms?: Room[];
  devices?: Device[];
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  floor_id: string;
  floor?: Floor;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  racks?: Rack[];
  devices?: Device[];
}

export interface Rack {
  id: string;
  name: string;
  total_units: number;
  room_id: string;
  room?: Room;
  devices?: Device[];
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  brand: string | null;
  model: string | null;
  serial_no: string | null;
  status: DeviceStatus;
  ip_address: string | null;
  mac_address: string | null;
  floor_id: string | null;
  room_id: string | null;
  rack_id: string | null;
  rack_unit: number | null;
  rack_size: number;
  pos_x: number;
  pos_y: number;
  vlan_id: string | null;
  subnet_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  floor?: Floor;
  room?: Room;
  rack?: Rack;
  vlan?: Vlan;
  subnet?: Subnet;
  ports?: Port[];
  connections_from?: Connection[];
  connections_to?: Connection[];
}

export interface Port {
  id: string;
  name: string;
  type: PortType;
  speed: string | null;
  status: PortStatus;
  device_id: string;
  device?: Device;
}

export interface Connection {
  id: string;
  from_device_id: string;
  to_device_id: string;
  from_port_id: string | null;
  to_port_id: string | null;
  type: ConnectionType;
  bandwidth: string | null;
  label: string | null;
  vlan_id: string | null;
  // Relations
  from_device?: Device;
  to_device?: Device;
  from_port?: Port;
  to_port?: Port;
}

export interface Vlan {
  id: string;
  vlan_number: number;
  name: string;
  description: string | null;
  devices?: Device[];
  subnets?: Subnet[];
}

export interface Subnet {
  id: string;
  cidr: string;
  gateway: string | null;
  description: string | null;
  vlan_id: string | null;
  vlan?: Vlan;
  devices?: Device[];
}

// Dashboard stats
export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  totalVlans: number;
  totalSubnets: number;
  totalRacks: number;
  devicesByType: { type: string; count: number }[];
  devicesByStatus: { status: string; count: number }[];
}
