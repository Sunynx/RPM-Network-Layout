-- ============================================================
-- RPM Network Layout Dashboard — Supabase Full Schema Migration
-- (No Mock Data)
-- ============================================================

-- ============================================================
-- DANGER: ลบข้อมูลและตารางเก่าทิ้งทั้งหมด (RESET DATABASE)
-- ============================================================
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS ports CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS subnets CASCADE;
DROP TABLE IF EXISTS vlans CASCADE;
DROP TABLE IF EXISTS racks CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS sites CASCADE;

-- Sites
CREATE TABLE IF NOT EXISTS sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'OFFICE' CHECK (type IN ('SERVER_ROOM', 'OFFICE', 'MDF', 'IDF')),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  pos_x DOUBLE PRECISION DEFAULT 0,
  pos_y DOUBLE PRECISION DEFAULT 0,
  width DOUBLE PRECISION DEFAULT 200,
  height DOUBLE PRECISION DEFAULT 150,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Racks
CREATE TABLE IF NOT EXISTS racks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_units INT DEFAULT 42,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VLANs
CREATE TABLE IF NOT EXISTS vlans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vlan_number INT UNIQUE NOT NULL CHECK (vlan_number BETWEEN 1 AND 4094),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subnets
CREATE TABLE IF NOT EXISTS subnets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cidr TEXT NOT NULL,
  gateway TEXT,
  description TEXT,
  vlan_id UUID REFERENCES vlans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ROUTER', 'SWITCH', 'FIREWALL', 'SERVER', 'AP', 'PATCH_PANEL', 'UPS', 'MEDIA_CONVERTER')),
  brand TEXT,
  model TEXT,
  serial_no TEXT,
  status TEXT DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'WARNING', 'MAINTENANCE')),
  ip_address TEXT,
  mac_address TEXT,
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  rack_id UUID REFERENCES racks(id) ON DELETE SET NULL,
  rack_unit INT,
  rack_size INT DEFAULT 1,
  pos_x DOUBLE PRECISION DEFAULT 0,
  pos_y DOUBLE PRECISION DEFAULT 0,
  vlan_id UUID REFERENCES vlans(id) ON DELETE SET NULL,
  subnet_id UUID REFERENCES subnets(id) ON DELETE SET NULL,
  notes TEXT,
  last_seen_online TIMESTAMPTZ DEFAULT now(),
  last_notified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ports
CREATE TABLE IF NOT EXISTS ports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ETHERNET' CHECK (type IN ('ETHERNET', 'FIBER', 'CONSOLE', 'SFP')),
  speed TEXT,
  status TEXT DEFAULT 'UP' CHECK (status IN ('UP', 'DOWN', 'DISABLED')),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Connections
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  to_device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  from_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
  to_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'ETHERNET' CHECK (type IN ('ETHERNET', 'FIBER', 'WIRELESS')),
  bandwidth TEXT,
  label TEXT,
  vlan_id UUID REFERENCES vlans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_rack ON devices(rack_id);
CREATE INDEX IF NOT EXISTS idx_devices_floor ON devices(floor_id);
CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room_id);
CREATE INDEX IF NOT EXISTS idx_connections_from ON connections(from_device_id);
CREATE INDEX IF NOT EXISTS idx_connections_to ON connections(to_device_id);
CREATE INDEX IF NOT EXISTS idx_ports_device ON ports(device_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
