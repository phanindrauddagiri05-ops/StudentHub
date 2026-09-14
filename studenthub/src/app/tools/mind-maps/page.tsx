'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Brain,
  Plus,
  Trash2,
  Download,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Sparkles,
  Link2,
  Palette,
  X,
  Check,
  Edit2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { saveMindMapRecord, getMindMapRecord } from '@/lib/storage/file-service';
import { MindMapNode, MindMapEdge, MindMapData } from '@/types/database';
import styles from './mindmaps.module.css';

const PALETTE = [
  { label: 'Blue', color: '#2563eb' },
  { label: 'Purple', color: '#7c3aed' },
  { label: 'Emerald', color: '#059669' },
  { label: 'Amber', color: '#d97706' },
  { label: 'Pink', color: '#db2777' },
  { label: 'Cyan', color: '#0891b2' },
  { label: 'Orange', color: '#ea580c' },
];

const INITIAL_NODES: MindMapNode[] = [
  { id: 'root', text: 'Computer Science Core', x: 450, y: 260, color: '#0f172a', notes: 'Main Subject' },
  { id: 'b1', text: 'Algorithms & Complexity', x: 200, y: 150, color: '#2563eb', parentId: 'root' },
  { id: 'b1_1', text: 'Dynamic Programming', x: 80, y: 90, color: '#2563eb', parentId: 'b1' },
  { id: 'b1_2', text: 'Graph Search (BFS/DFS)', x: 60, y: 190, color: '#2563eb', parentId: 'b1' },
  { id: 'b2', text: 'Operating Systems', x: 700, y: 150, color: '#7c3aed', parentId: 'root' },
  { id: 'b2_1', text: 'Virtual Memory & Paging', x: 840, y: 100, color: '#7c3aed', parentId: 'b2' },
  { id: 'b2_2', text: 'Process Scheduling', x: 840, y: 200, color: '#7c3aed', parentId: 'b2' },
  { id: 'b3', text: 'Computer Networks', x: 450, y: 460, color: '#059669', parentId: 'root' },
  { id: 'b3_1', text: 'TCP/IP Model', x: 300, y: 530, color: '#059669', parentId: 'b3' },
  { id: 'b3_2', text: 'Routing Protocols (BGP/OSPF)', x: 600, y: 530, color: '#059669', parentId: 'b3' },
];

const INITIAL_EDGES: MindMapEdge[] = [
  { id: 'e1', source: 'root', target: 'b1' },
  { id: 'e2', source: 'b1', target: 'b1_1' },
  { id: 'e3', source: 'b1', target: 'b1_2' },
  { id: 'e4', source: 'root', target: 'b2' },
  { id: 'e5', source: 'b2', target: 'b2_1' },
  { id: 'e6', source: 'b2', target: 'b2_2' },
  { id: 'e7', source: 'root', target: 'b3' },
  { id: 'e8', source: 'b3', target: 'b3_1' },
  { id: 'e9', source: 'b3', target: 'b3_2' },
];

function MindMapCanvas() {
  const searchParams = useSearchParams();
  const mapIdParam = searchParams.get('id');
  const { user } = useAuth();

  const [title, setTitle] = useState('Computer Science Core');
  const [nodes, setNodes] = useState<MindMapNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<MindMapEdge[]>(INITIAL_EDGES);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  // Viewport transformation: zoom & pan
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Text-to-MindMap drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Notifications & UI feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Load saved mind map if ID param is in URL
  useEffect(() => {
    if (mapIdParam) {
      getMindMapRecord(mapIdParam).then((saved) => {
        if (saved) {
          setTitle(saved.title || 'Loaded Mind Map');
          setNodes(saved.nodes || INITIAL_NODES);
          setEdges(saved.edges || INITIAL_EDGES);
          showToast(`Loaded "${saved.title}"`);
        }
      });
    }
  }, [mapIdParam]);

  // Center initial view
  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2 - 450, y: rect.height / 2 - 280 });
    }
  }, []);

  // Pan canvas handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${styles.nodeCard}`)) {
      return; // Handled by node
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSelectedNodeId(null);
    setColorPickerOpen(false);
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      } else if (draggingNodeId) {
        // Move dragging node
        const newX = Math.round((e.clientX - pan.x - dragOffset.x) / scale);
        const newY = Math.round((e.clientY - pan.y - dragOffset.y) / scale);
        setNodes((prev) =>
          prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
        );
      }
    },
    [isPanning, panStart, pan.x, pan.y, draggingNodeId, dragOffset.x, dragOffset.y, scale]
  );

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: MindMapNode) => {
    e.stopPropagation();
    if (connectingFromId) {
      // Create edge
      if (connectingFromId !== node.id) {
        const newEdge: MindMapEdge = {
          id: `edge_${connectingFromId}_${node.id}_${Date.now()}`,
          source: connectingFromId,
          target: node.id,
        };
        setEdges((prev) => [...prev, newEdge]);
        showToast('Connected nodes!');
      }
      setConnectingFromId(null);
      return;
    }

    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - (node.x * scale + pan.x),
      y: e.clientY - (node.y * scale + pan.y),
    });
  };

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(2, Math.round((s + 0.15) * 100) / 100));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, Math.round((s - 0.15) * 100) / 100));
  const handleResetZoom = () => {
    setScale(1);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2 - 450, y: rect.height / 2 - 280 });
    }
  };

  // Add child or new root node
  const handleAddNode = () => {
    const parent = nodes.find((n) => n.id === selectedNodeId);
    const newId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newColor = parent?.color || PALETTE[nodes.length % PALETTE.length].color;

    const newNode: MindMapNode = {
      id: newId,
      text: 'New Concept',
      x: parent ? parent.x + 160 : 450,
      y: parent ? parent.y + (Math.random() * 80 - 40) : 300,
      color: newColor,
      parentId: parent ? parent.id : undefined,
    };

    setNodes((prev) => [...prev, newNode]);

    if (parent) {
      setEdges((prev) => [
        ...prev,
        { id: `edge_${parent.id}_${newId}`, source: parent.id, target: newId },
      ]);
    }

    setSelectedNodeId(newId);
    setEditingNodeId(newId);
    setEditText('New Concept');
  };

  // Delete node
  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
    showToast('Node deleted.');
  };

  // Inline edit commit
  const handleSaveEdit = (nodeId: string) => {
    if (editText.trim()) {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, text: editText.trim() } : n))
      );
    }
    setEditingNodeId(null);
  };

  // Color selection
  const handleColorSelect = (color: string) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, color } : n))
    );
    setColorPickerOpen(false);
  };

  // Generate Mind Map from entered text
  const handleGenerateFromText = async () => {
    if (!sourceText.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/mind-maps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          title: title || 'Study Mind Map',
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setTitle(json.data.title || title);
        setNodes(json.data.nodes || []);
        setEdges(json.data.edges || []);
        setDrawerOpen(false);
        setSourceText('');
        handleResetZoom();
        showToast('Generated interactive mind map!');
      } else {
        throw new Error(json.error || 'Failed to generate mind map.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating mind map';
      showToast(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save mind map to account & history
  const handleSaveMindMap = async () => {
    const mapData: MindMapData = {
      title,
      nodes,
      edges,
    };
    const id = mapIdParam || `map_${Date.now()}`;
    await saveMindMapRecord({
      id,
      userId: user?.id || 'guest',
      title,
      data: mapData,
    });
    showToast('Saved mind map to History!');
  };

  // Export JSON
  const handleExportJson = () => {
    const mapData = { title, nodes, edges };
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}_mindmap.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported mind map JSON!');
  };

  // Export as Image
  const handleExportImage = () => {
    // Quick SVG export
    const svgEl = canvasRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded SVG diagram!');
  };

  // Calculate bezier curve connection path between two nodes
  const getEdgePath = (sourceNode: MindMapNode, targetNode: MindMapNode) => {
    const x1 = sourceNode.x * scale + pan.x + 80;
    const y1 = sourceNode.y * scale + pan.y + 20;
    const x2 = targetNode.x * scale + pan.x + 80;
    const y2 = targetNode.y * scale + pan.y + 20;

    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + (x2 > x1 ? dx : -dx)} ${y1}, ${x2 - (x2 > x1 ? dx : -dx)} ${y2}, ${x2} ${y2}`;
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className={styles.page}>
      {/* Top Controls Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <Brain size={22} color="#db2777" />
          <input
            type="text"
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            title="Click to rename mind map"
          />
          <span className={styles.badge}>Phase 6 • Mind Map</span>
        </div>

        <div className={styles.toolbar}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            id="text-to-mindmap-btn"
          >
            <Sparkles size={14} style={{ marginRight: 6 }} />
            Text to Map
          </Button>

          <div className={styles.toolGroup}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleAddNode}
              title="Add Node"
              id="add-node-btn"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className={[
                styles.iconBtn,
                connectingFromId ? styles.iconBtnActive : '',
              ].join(' ')}
              onClick={() => {
                if (selectedNodeId) {
                  setConnectingFromId(connectingFromId ? null : selectedNodeId);
                } else {
                  showToast('Select a node first to connect.');
                }
              }}
              title="Connect node to another node"
              id="connect-node-btn"
            >
              <Link2 size={16} />
            </button>
            {selectedNodeId && (
              <>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setColorPickerOpen(!colorPickerOpen)}
                  title="Change Node Color"
                  id="color-node-btn"
                >
                  <Palette size={16} />
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={handleDeleteSelected}
                  title="Delete Selected Node"
                  id="delete-node-btn"
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </>
            )}
          </div>

          {/* Color Picker Swatches */}
          {colorPickerOpen && (
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '4px 8px',
                background: '#fff',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {PALETTE.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => handleColorSelect(p.color)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title={p.label}
                />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportJson}
              id="export-json-btn"
              title="Export JSON"
            >
              <Download size={14} style={{ marginRight: 6 }} />
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMindMap}
              id="save-mindmap-btn"
            >
              <Save size={14} style={{ marginRight: 6 }} />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div
        ref={canvasRef}
        className={styles.canvasContainer}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* SVG Edges Layer */}
        <svg className={styles.canvasSvg}>
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;
            return (
              <path
                key={edge.id}
                d={getEdgePath(src, tgt)}
                fill="none"
                stroke={tgt.color || '#94a3b8'}
                strokeWidth={2.5}
                strokeOpacity={0.7}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isEditing = editingNodeId === node.id;
          const isRoot = node.id === 'root' || !node.parentId;

          return (
            <div
              key={node.id}
              className={[
                styles.nodeCard,
                isSelected ? styles.nodeCardSelected : '',
                isRoot ? styles.nodeCardRoot : '',
              ].join(' ')}
              style={{
                transform: `translate(${node.x * scale + pan.x}px, ${node.y * scale + pan.y}px) scale(${scale})`,
                borderColor: node.color || '#cbd5e1',
                transformOrigin: 'top left',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onDoubleClick={() => {
                setEditingNodeId(node.id);
                setEditText(node.text);
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    className={styles.nodeInput}
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(node.id);
                      if (e.key === 'Escape') setEditingNodeId(null);
                    }}
                    onBlur={() => handleSaveEdit(node.id)}
                  />
                  <button
                    type="button"
                    className={styles.nodeSmallBtn}
                    onClick={() => handleSaveEdit(node.id)}
                  >
                    <Check size={14} color="#059669" />
                  </button>
                </div>
              ) : (
                <div className={styles.nodeText}>{node.text}</div>
              )}

              {isSelected && !isEditing && (
                <div className={styles.nodeToolbar}>
                  <button
                    type="button"
                    className={styles.nodeSmallBtn}
                    onClick={() => {
                      setEditingNodeId(node.id);
                      setEditText(node.text);
                    }}
                    title="Edit Text"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    className={styles.nodeSmallBtn}
                    onClick={handleAddNode}
                    title="Add Child Node"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls */}
      <div className={styles.floatingControls}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={handleResetZoom}
          title="Reset View"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Text-to-MindMap Drawer */}
      {drawerOpen && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitle}>Generate from Text</div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setDrawerOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
            Paste your syllabus outline, lecture notes, or key study points to automatically construct an interactive visual diagram.
          </p>

          <textarea
            rows={12}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder={`Example:
Operating Systems Architecture
- Concurrency & Synchronization
  - Mutex and Semaphores
  - Deadlock conditions
- Memory Management
  - Paging and Segmentation
  - Virtual memory algorithms`}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              fontFamily: 'inherit',
            }}
          />

          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateFromText}
            disabled={isGenerating || !sourceText.trim()}
            fullWidth
            id="generate-map-submit"
          >
            <Sparkles size={16} style={{ marginRight: 6 }} />
            {isGenerating ? 'Structuring Diagram...' : 'Generate Mind Map'}
          </Button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </div>
  );
}

export default function MindMapsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading Mind Map Canvas...</div>}>
      <MindMapCanvas />
    </Suspense>
  );
}
