-- Migration V2: Add MEDIA_CONVERTER and connection VLANs

-- 1. Drop existing type constraint on devices table
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_type_check;

-- 2. Add the new constraint with MEDIA_CONVERTER included
ALTER TABLE public.devices ADD CONSTRAINT devices_type_check 
  CHECK (type IN ('ROUTER', 'SWITCH', 'FIREWALL', 'SERVER', 'AP', 'PATCH_PANEL', 'UPS', 'MEDIA_CONVERTER'));

-- 3. Add vlan_id column to connections table
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS vlan_id UUID REFERENCES public.vlans(id) ON DELETE SET NULL;

-- 4. Informational output
SELECT 'Migration successful: devices type updated and vlan_id added to connections' AS status;
