"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection as RFConnection,
  type Node,
  type Edge,
  Panel,
  MarkerType,
  type NodeProps,
  Position,
  reconnectEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { createClient } from "@/lib/supabase/client";
import { getEdgeStyle } from "@/lib/constants";
import type { Device, Connection, Vlan } from "@/types/network";
import type { ConnectionMediaType } from "@/lib/constants";
import DeviceNode from "@/components/topology/DeviceNode";
import TopologyToolbar from "@/components/topology/TopologyToolbar";
import DeviceDetailPanel from "@/components/topology/DeviceDetailPanel";
import ConnectionModal from "@/components/topology/ConnectionModal";
import DeviceFormModal, { type DeviceFormData } from "@/components/devices/DeviceFormModal";
import PortMappingModal from "@/components/topology/PortMappingModal";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

const nodeTypes = { device: DeviceNode };

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === "LR";
  // Increase spacing significantly to spread out dense meshes
  dagreGraph.setGraph({ rankdir: direction, nodesep: 250, ranksep: 300, edgesep: 100 });

  const deviceNodes = nodes.filter(n => n.type === 'device').map(n => ({ ...n }));

  // Separate nodes into connected and disconnected
  const connectedNodeIds = new Set<string>();
  edges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const connectedNodes = deviceNodes.filter(n => connectedNodeIds.has(n.id));
  const disconnectedNodes = deviceNodes.filter(n => !connectedNodeIds.has(n.id));

  // 1. Layout connected nodes with dagre
  if (connectedNodes.length > 0) {
    connectedNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 220, height: 100 });
    });
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
    dagre.layout(dagreGraph);

    connectedNodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 50,
      };
      node.targetPosition = isHorizontal ? Position.Left : Position.Top;
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    });
  }

  // 2. Layout disconnected nodes in a Grid format below the tree
  let startX = 50;
  let startY = 50;

  if (connectedNodes.length > 0) {
    if (isHorizontal) {
      // Find max X if layout is horizontal
      const maxX = Math.max(...connectedNodes.map(n => n.position.x)) + 300;
      startX = maxX;
    } else {
      // Find max Y if layout is vertical
      const maxY = Math.max(...connectedNodes.map(n => n.position.y)) + 300;
      startY = maxY;
    }
  }

  disconnectedNodes.forEach((node, idx) => {
    node.position = { x: startX, y: startY };
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    
    if (isHorizontal) {
      startY += 150;
      if ((idx + 1) % 6 === 0) {
        startY = 50;
        startX += 250;
      }
    } else {
      startX += 250;
      if ((idx + 1) % 8 === 0) {
        startX = 50;
        startY += 150;
      }
    }
  });

  const updatedEdges = edges.map(e => ({
    ...e,
    sourceHandle: isHorizontal ? "right-source" : "bottom-source",
    targetHandle: isHorizontal ? "left-target" : "top-target"
  }));

  return { nodes: [...connectedNodes, ...disconnectedNodes], edges: updatedEdges };
}


export default function TopologyPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [vlans, setVlans] = useState<Vlan[]>([]);
  const [activeVlanId, setActiveVlanId] = useState<string | null>(null);
  // Connection Modal state
  const [connModalOpen, setConnModalOpen] = useState(false);
  const [connModalMode, setConnModalMode] = useState<"create" | "edit">("create");
  const [pendingConnection, setPendingConnection] = useState<RFConnection | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [isPortMappingOpen, setIsPortMappingOpen] = useState(false);
  
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [savingDevice, setSavingDevice] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
    name: "",
    type: "SWITCH",
    brand: "Ruijie",
    model: "",
    serial_no: "",
    status: "ONLINE",
    ip_address: "",
    mac_address: "",
    rack_id: null,
    rack_unit: null,
    rack_size: 1,
  });

  const { addToast } = useToast();

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceFormData.name.trim()) {
      addToast({ type: "error", title: "Error", message: "Device name is required" });
      return;
    }
    setSavingDevice(true);
    try {
      const supabase = createClient();
      let error;
      if (editingDeviceId) {
        const res = await supabase.from('devices').update(deviceFormData).eq('id', editingDeviceId).select().single();
        error = res.error;
      } else {
        const res = await supabase.from('devices').insert([deviceFormData]).select().single();
        error = res.error;
      }
      if (error) throw error;
      
      addToast({ type: "success", title: "สำเร็จ", message: editingDeviceId ? "แก้ไขอุปกรณ์สำเร็จ" : "เพิ่มอุปกรณ์สำเร็จ" });
      setIsDeviceModalOpen(false);
      setEditingDeviceId(null);
      setDeviceFormData({
        name: "", type: "SWITCH", brand: "Ruijie", model: "", serial_no: "",
        status: "ONLINE", ip_address: "", mac_address: "", rack_id: null, rack_unit: null, rack_size: 1,
      });
      setRefreshTrigger(prev => prev + 1); // Force immediate refresh
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    } finally {
      setSavingDevice(false);
    }
  };

  const handleEditDevice = (device: Device) => {
    setDeviceFormData({
      name: device.name,
      type: device.type,
      brand: device.brand || "",
      model: device.model || "",
      serial_no: device.serial_no || "",
      status: device.status,
      ip_address: device.ip_address || "",
      mac_address: device.mac_address || "",
      rack_id: device.rack_id,
      rack_unit: device.rack_unit,
      rack_size: device.rack_size,
    });
    setEditingDeviceId(device.id);
    setIsDeviceModalOpen(true);
  };

  const handleDeleteDevice = async (device: Device) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์ ${device.name}?`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('devices').delete().eq('id', device.id);
      if (error) throw error;
      addToast({ type: "success", title: "สำเร็จ", message: "ลบอุปกรณ์สำเร็จ" });
      if (selectedDevice?.id === device.id) {
        setSelectedDevice(null);
      }
      setRefreshTrigger(prev => prev + 1); // Force immediate refresh
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchTopology() {
      try {
        const [{ data: devData }, { data: connData }, { data: vlanData }] = await Promise.all([
          supabase.from("devices").select("*"),
          supabase.from("connections").select("*"),
          supabase.from("vlans").select("*"),
        ]);

        if (!isMounted) return;

        const allDevices = (devData || []) as Device[];
        const allConnections = (connData || []) as Connection[];
        setDevices(allDevices);
        setVlans((vlanData || []) as Vlan[]);
        
        // Update selected device if it's currently open so the detail panel is realtime
        setSelectedDevice((prev) => {
          if (!prev) return null;
          return allDevices.find(d => d.id === prev.id) || null;
        });

        const deviceNodes: Node[] = allDevices.map((d) => ({
          id: d.id,
          type: "device",
          position: { x: d.pos_x || 0, y: d.pos_y || 0 },
          data: { device: d, activeVlanId: null }, // updated later in useEffect when activeVlanId changes
        }));

        const flowNodes = deviceNodes;

        const flowEdges: Edge[] = allConnections.map((c) => ({
          id: c.id,
          source: c.from_device_id,
          target: c.to_device_id,
          sourceHandle: (c as any).source_handle || "bottom-source",
          targetHandle: (c as any).target_handle || "top-target",
          type: "smoothstep",
          data: { connection: c },
          animated: c.type === "FIBER" || (activeVlanId && c.vlan_id === activeVlanId) || false,
          label: showLabels ? (c.label ? (c.vlan_id ? `${c.label} (VLAN)` : c.label) : (c.vlan_id ? `VLAN` : undefined)) : undefined,
          style: {
            ...getEdgeStyle(c.type),
            opacity: activeVlanId ? (c.vlan_id === activeVlanId ? 1 : 0.1) : 1,
            strokeWidth: activeVlanId && c.vlan_id === activeVlanId ? 4 : getEdgeStyle(c.type).strokeWidth,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: getEdgeStyle(c.type).stroke,
            width: 16,
            height: 16,
          },
          labelStyle: {
            fill: "var(--text-muted)",
            fontSize: 10,
            fontWeight: 500,
          },
          labelBgStyle: {
            fill: "var(--bg-card)",
            fillOpacity: 0.9,
          },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 4,
        }));

        // Only auto-layout if all nodes are at origin (0,0) indicating a fresh import
        const needsAutoLayout = deviceNodes.length > 0 && deviceNodes.every(n => n.position.x === 0 && n.position.y === 0);
        
        if (needsAutoLayout) {
          const layouted = getLayoutedElements(flowNodes, flowEdges, "TB");
          setNodes(layouted.nodes);
          setEdges(layouted.edges);
        } else {
          // Spread out nodes that haven't been positioned yet (still at 0,0)
          let unpositionedStartX = 50;
          let unpositionedStartY = 50;
          
          flowNodes.forEach(n => {
            if (n.position.x === 0 && n.position.y === 0) {
              n.position = { x: unpositionedStartX, y: unpositionedStartY };
              unpositionedStartX += 240;
              if (unpositionedStartX > 1800) {
                unpositionedStartX = 50;
                unpositionedStartY += 120;
              }
            }
          });
          setNodes((prevNodes) => {
            const activeIds = new Set(flowNodes.map(n => n.id));
            return prevNodes
              .filter(pn => activeIds.has(pn.id))
              .map(pn => {
                 const updated = flowNodes.find(fn => fn.id === pn.id)!;
                 return { ...pn, data: updated.data, type: updated.type };
              })
              .concat(flowNodes.filter(n => !prevNodes.some(pn => pn.id === n.id)));
          });
          
          setEdges((prevEdges) => {
            const activeIds = new Set(flowEdges.map(e => e.id));
            return prevEdges
              .filter(pe => activeIds.has(pe.id))
              .map(pe => {
                 const updated = flowEdges.find(fe => fe.id === pe.id)!;
                 return { ...pe, ...updated };
              })
              .concat(flowEdges.filter(e => !prevEdges.some(pe => pe.id === e.id)));
          });
        }
      } catch (err) {
        console.error("Failed to fetch topology:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTopology();

    const channel = supabase
      .channel('topology_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => fetchTopology())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => fetchTopology())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vlans' }, () => fetchTopology())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [setNodes, setEdges, showLabels, activeVlanId, refreshTrigger]); // Added showLabels to dependencies

  const displayNodes = useMemo(() => {
    return nodes.map(n => {
       const isConnected = hoveredNodeId ? edges.some(e => (e.source === hoveredNodeId && e.target === n.id) || (e.target === hoveredNodeId && e.source === n.id)) : false;
       const isHovered = n.id === hoveredNodeId;
       const opacity = hoveredNodeId ? (isHovered || isConnected ? 1 : 0.2) : 1;
       return {
         ...n,
         style: { ...n.style, opacity, transition: 'all 0.5s ease' },
         data: { ...n.data, activeVlanId }
       }
    })
  }, [nodes, edges, hoveredNodeId, activeVlanId]);

  const displayEdges = useMemo(() => {
    return edges.map(e => {
        const c = e.data?.connection as Connection | undefined;
        if (!c) return e;
        
        const isMatch = activeVlanId && c.vlan_id === activeVlanId;
        const baseStyle = getEdgeStyle(c.type);

        const isConnectedToHover = hoveredNodeId ? (e.source === hoveredNodeId || e.target === hoveredNodeId) : false;
        
        let opacity = 1;
        if (activeVlanId && hoveredNodeId) {
           opacity = (isMatch && isConnectedToHover) ? 1 : 0.1;
        } else if (activeVlanId) {
           opacity = isMatch ? 1 : 0.1;
        } else if (hoveredNodeId) {
           opacity = isConnectedToHover ? 1 : 0.1;
        }
        
        const isAnimated = c.type === "FIBER" || isMatch || (!!hoveredNodeId && isConnectedToHover) || false;
        const strokeWidth = (isMatch || isConnectedToHover) ? 4 : baseStyle.strokeWidth;
        
        return {
          ...e,
          animated: isAnimated,
          style: {
            ...baseStyle,
            opacity,
            strokeWidth,
            transition: 'all 0.5s ease'
          },
        };
    })
  }, [edges, hoveredNodeId, activeVlanId]);

  const onConnect = useCallback(
    (connection: RFConnection) => {
      setPendingConnection(connection);
      setConnModalMode("create");
      setConnModalOpen(true);
    },
    []
  );

  const handleConnectionConfirm = useCallback(
    async (type: ConnectionMediaType, label?: string, vlan_id?: string | null, sourcePort?: string, targetPort?: string) => {
      setConnModalOpen(false);
      const supabase = createClient();

      if (connModalMode === "create" && pendingConnection) {
        const { data, error } = await supabase.from("connections").insert({
          from_device_id: pendingConnection.source,
          to_device_id: pendingConnection.target,
          source_handle: pendingConnection.sourceHandle || null,
          target_handle: pendingConnection.targetHandle || null,
          source_port_name: sourcePort || null,
          target_port_name: targetPort || null,
          type,
          label: label || null,
          vlan_id: vlan_id || null,
        }).select().single();

        if (error) {
          addToast({ type: "error", title: "สร้างการเชื่อมต่อล้มเหลว", message: error.message });
          return;
        }

        setEdges((eds) => [
          ...eds,
          {
            id: data.id,
            source: pendingConnection.source,
            target: pendingConnection.target,
            sourceHandle: pendingConnection.sourceHandle || undefined,
            targetHandle: pendingConnection.targetHandle || undefined,
            type: "smoothstep",
            data: { connection: data },
            animated: type === "FIBER" || (activeVlanId && vlan_id === activeVlanId) || false,
            label: showLabels ? (label ? (vlan_id ? `${label} (VLAN)` : label) : (vlan_id ? `VLAN` : undefined)) : undefined,
            style: {
              ...getEdgeStyle(type),
              opacity: activeVlanId ? (vlan_id === activeVlanId ? 1 : 0.1) : 1,
              strokeWidth: activeVlanId && vlan_id === activeVlanId ? 4 : getEdgeStyle(type).strokeWidth,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeStyle(type).stroke, width: 16, height: 16 },
          }
        ]);
        addToast({ type: "success", title: "เชื่อมต่อสำเร็จ", message: `สร้างสาย ${type} เรียบร้อย` });
      } else if (connModalMode === "edit" && editingEdgeId) {
        const { data, error } = await supabase.from("connections").update({ 
          type, 
          label: label || null, 
          vlan_id: vlan_id || null,
          source_port_name: sourcePort || null,
          target_port_name: targetPort || null
        }).eq("id", editingEdgeId).select().single();
        
        if (error) {
          addToast({ type: "error", title: "แก้ไขล้มเหลว", message: error.message });
          return;
        }
        
        setEdges(eds => eds.map(e => e.id === editingEdgeId ? {
          ...e,
          data: { ...e.data, connection: data },
          animated: type === "FIBER" || (activeVlanId && vlan_id === activeVlanId) || false,
          label: showLabels ? (label ? (vlan_id ? `${label} (VLAN)` : label) : (vlan_id ? `VLAN` : undefined)) : undefined,
          style: {
            ...getEdgeStyle(type),
            opacity: activeVlanId ? (vlan_id === activeVlanId ? 1 : 0.1) : 1,
            strokeWidth: activeVlanId && vlan_id === activeVlanId ? 4 : getEdgeStyle(type).strokeWidth,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: getEdgeStyle(type).stroke, width: 16, height: 16 }
        } : e));
        addToast({ type: "success", title: "แก้ไขสำเร็จ", message: `เปลี่ยนเป็น ${type} เรียบร้อย` });
      }
      setPendingConnection(null);
      setEditingEdgeId(null);
    },
    [connModalMode, pendingConnection, editingEdgeId, setEdges, addToast, activeVlanId]
  );

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    const supabase = createClient();
    for (const edge of edgesToDelete) {
      await supabase.from("connections").delete().eq("id", edge.id);
    }
    addToast({ type: "info", title: "ลบการเชื่อมต่อแล้ว", message: `ลบ ${edgesToDelete.length} การเชื่อมต่อ` });
  }, [addToast]);

  const handleDeleteConnection = useCallback(async () => {
    if (!editingEdgeId) return;
    const edgeToDelete = edges.find(e => e.id === editingEdgeId);
    if (edgeToDelete) {
      await onEdgesDelete([edgeToDelete]);
      setEdges(eds => eds.filter(e => e.id !== editingEdgeId));
    }
  }, [editingEdgeId, edges, onEdgesDelete, setEdges]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingEdgeId(edge.id);
    setConnModalMode("edit");
    setConnModalOpen(true);
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const device = devices.find((d) => d.id === node.id);
      if (device) setSelectedDevice(device);
    },
    [devices]
  );

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(
    () => setHoveredNodeId(null),
    []
  );

  const handleAutoLayout = useCallback(
    (direction: "TB" | "LR") => {
      const layouted = getLayoutedElements(nodes, edges, direction);
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const handleSavePositions = useCallback(async () => {
    const supabase = createClient();
    const updates = nodes.map((node) =>
      supabase
        .from("devices")
        .update({ pos_x: Math.round(node.position.x), pos_y: Math.round(node.position.y) })
        .eq("id", node.id)
    );
    await Promise.all(updates);
    addToast({ type: "success", title: "บันทึกสำเร็จ", message: "บันทึกตำแหน่งของอุปกรณ์ทั้งหมดแล้ว" });
  }, [nodes, addToast]);

  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
    const supabase = createClient();
    const nodesToSave = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
    
    const updates = nodesToSave.map(n => 
      supabase
        .from("devices")
        .update({ pos_x: Math.round(n.position.x), pos_y: Math.round(n.position.y) })
        .eq("id", n.id)
    );
    await Promise.all(updates);
  }, []);

  const onReconnect = useCallback(
    async (oldEdge: Edge, newConnection: RFConnection) => {
      if (oldEdge.id.startsWith("xy-edge")) {
        addToast({ type: "error", title: "ย้ายไม่สำเร็จ", message: "กรุณารีเฟรชหน้าเว็บ 1 รอบก่อนแก้ไขเส้นนี้ครับ (เส้นชั่วคราว)" });
        return;
      }

      // Optimitically update UI
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      
      const supabase = createClient();
      const { data, error } = await supabase.from('connections').update({
        from_device_id: newConnection.source,
        to_device_id: newConnection.target,
        source_handle: newConnection.sourceHandle || null,
        target_handle: newConnection.targetHandle || null,
      }).eq('id', oldEdge.id).select().single();

      if (error) {
        console.error("Reconnect Error:", error.message || error);
        addToast({ type: "error", title: "ย้ายไม่สำเร็จ", message: error.message || "ไม่สามารถย้ายเส้นได้" });
      } else {
        addToast({ type: "success", title: "สำเร็จ", message: "ย้ายการเชื่อมต่อแล้ว" });
      }
    },
    [setEdges, addToast]
  );

  const nodeColorMap = useMemo(
    () =>
      (node: Node) => {
        const device = node.data?.device as Device | undefined;
        if (!device) return "#475569";
        switch (device.status) {
          case "ONLINE":
            return "#34d399";
          case "OFFLINE":
            return "#f87171";
          case "WARNING":
            return "#fbbf24";
          default:
            return "#a78bfa";
        }
      },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex">
      <div className="flex-1 overflow-hidden relative">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, duration: 800 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "smoothstep",
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--text-muted)"
            style={{ opacity: 0.3 }}
          />
          <Controls
            position="top-right"
            showInteractive={false}
            style={{ borderRadius: "10px", overflow: "hidden" }}
          />
          <MiniMap
            nodeColor={nodeColorMap}
            maskColor="rgba(0,0,0,0.2)"
            style={{ borderRadius: "8px" }}
          />
          <Panel position="top-left">
            <TopologyToolbar
              onAutoLayout={handleAutoLayout}
              onSavePositions={handleSavePositions}
              vlans={vlans}
              activeVlanId={activeVlanId}
              onVlanChange={setActiveVlanId}
              onAddDeviceClick={() => {
                setEditingDeviceId(null);
                setDeviceFormData({
                  name: "", type: "SWITCH", brand: "Ruijie", model: "", serial_no: "",
                  status: "ONLINE", ip_address: "", mac_address: "", rack_id: null, rack_unit: null, rack_size: 1,
                });
                setIsDeviceModalOpen(true);
              }}
            />
          </Panel>
        </ReactFlow>

        {/* Legend */}
        {(() => {
          const hasOfflineDevice = nodes.some((n) => {
            const device = n.data?.device as Device | undefined;
            return device?.status === "OFFLINE";
          });
          
          return (
        <div
          className="absolute bottom-4 left-4 flex gap-4 px-4 py-2 rounded-xl text-xs"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-400 rounded" />
            <span style={{ color: "var(--text-muted)" }}>Ethernet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-amber-400 rounded" />
            <span style={{ color: "var(--text-muted)" }}>Fiber</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-purple-400" />
            <span style={{ color: "var(--text-muted)" }}>Wireless</span>
          </div>
          {hasOfflineDevice && (
            <div className="flex items-center gap-2 border-l pl-4 border-[var(--border-color)]">
              <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
              <span style={{ color: "var(--text-muted)" }}>Offline Device</span>
            </div>
          )}
        </div>
        );
        })()}
      </div>

      {/* Device Detail */}
      {selectedDevice && (
        <DeviceDetailPanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onEdit={handleEditDevice}
          onDelete={handleDeleteDevice}
          onViewPorts={() => setIsPortMappingOpen(true)}
        />
      )}

      {/* Modals */}
      <PortMappingModal
        isOpen={isPortMappingOpen}
        onClose={() => setIsPortMappingOpen(false)}
        device={selectedDevice}
      />

      <ConnectionModal
        isOpen={connModalOpen}
        onClose={() => { setConnModalOpen(false); setPendingConnection(null); setEditingEdgeId(null); }}
        onConfirm={handleConnectionConfirm}
        onDelete={handleDeleteConnection}
        mode={connModalMode}
        defaultType={
          connModalMode === "edit" && editingEdgeId
            ? (edges.find((e) => e.id === editingEdgeId)?.data?.connection as Connection)?.type
            : undefined
        }
        defaultLabel={
          connModalMode === "edit" && editingEdgeId
            ? (edges.find((e) => e.id === editingEdgeId)?.data?.connection as Connection)?.label || ""
            : undefined
        }
        defaultVlanId={
          connModalMode === "edit" && editingEdgeId
            ? (edges.find((e) => e.id === editingEdgeId)?.data?.connection as Connection)?.vlan_id || ""
            : undefined
        }
        defaultSourcePort={
          connModalMode === "edit" && editingEdgeId
            ? (edges.find((e) => e.id === editingEdgeId)?.data?.connection as any)?.source_port_name || ""
            : undefined
        }
        defaultTargetPort={
          connModalMode === "edit" && editingEdgeId
            ? (edges.find((e) => e.id === editingEdgeId)?.data?.connection as any)?.target_port_name || ""
            : undefined
        }
        vlans={vlans}
      />

      <DeviceFormModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        formData={deviceFormData}
        setFormData={setDeviceFormData}
        onSubmit={handleDeviceSubmit}
        saving={savingDevice}
        isEditing={!!editingDeviceId}
        vlans={vlans}
        racks={[]}
      />
    </div>
  );
}
