import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import ShapeRenderer from './shape_renderer';
import ShapeSelector from './shapes/Shape_Selector';

import io from 'socket.io-client';
import axios from 'axios';

let socket = null;
try {
  socket = io('http://localhost:5000', { 
    reconnectionDelay: 1000, 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket.io connected to backend:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.warn('⚠️ Socket.io connection error (backend may not be running):', error.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket.io disconnected:', reason);
  });
} catch (err) {
  console.warn('⚠️ Socket.io init error (backend unavailable):', err.message);
  socket = null;
}

const Whiteboard = () => {
  const [showToolbar, setShowToolbar] = useState(true); // Toggle toolbar visibility
  const sidebarWidth = showToolbar ? 250 : 0; 
  const containerRef = useRef(null);
  
  const [stageSize, setStageSize] = useState({
    width: 800,
    height: 600,
  });

  // Handle measuring parent container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setStageSize({
        width: Math.max(rect.width - sidebarWidth, 100),
        height: Math.max(rect.height, 100),
      });
    };

    // Initial size
    updateSize();

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [sidebarWidth]);

  useEffect(() => {
    if (!socket) return; // Skip if socket not initialized
    
    // Fetch initial shapes from the server when the component mounts
    socket.on('receive-shape', (incomingShape) => {
      setShapes((prev) => {
        const index = prev.findIndex((s) => s.id === incomingShape.id);
        if (index > -1) {
          // if shape already exists, update it
          const newShapes = [...prev];
          newShapes[index] = incomingShape;
          return newShapes;
        }
        // if shape is new, add it to the list
        return [...prev, incomingShape];
      });
    });

    // fetch initial shapes from the server when the component mounts
    socket.on('delete-shape', (deletedId) => {
      setShapes((prev) => prev.filter((s) => s.id !== deletedId));
    });

    return () => socket.off(); // cleanup listeners on unmount
  }, []);

  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [history, setHistory] = useState([[]]); // Lưu mảng các trạng thái của shapes
  const [historyStep, setHistoryStep] = useState(0); // Vị trí hiện tại trong lịch sử
  
  const [textBoxes, setTextBoxes] = useState([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState(null);

  const GRID_OPTIONS = [0, 80, 40, 20];
  const [gridIndex, setGridIndex] = useState(0); // Mặc định là 0 (Tắt lưới)
  
  const currentGridSize = GRID_OPTIONS[gridIndex];
  const showGrid = currentGridSize > 0;

  const [mode, setMode] = useState('select'); 
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const outlineThickness = 2; // mặc định và cố định, slider đã ẩn

  const isDrawing = useRef(false);
  
  // Map pan state
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  // Hàm lưu trạng thái mới vào lịch sử
  const commitToHistory = (newShapes) => {
    // Cắt bỏ các "tương lai" nếu người dùng đang ở quá khứ mà lại vẽ thêm
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Nút Undo
  const handleUndo = () => {
    if (historyStep === 0) return;
    const prevStep = historyStep - 1;
    setShapes(history[prevStep]);
    setHistoryStep(prevStep);
    // (Tùy chọn) Có thể bắn socket emit ở đây để báo cho người khác biết bạn vừa undo
  };

  // Nút Redo
  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const nextStep = historyStep + 1;
    setShapes(history[nextStep]);
    setHistoryStep(nextStep);
  };

  // FIXED: Optimized function to add new shapes without "not implemented" error
  const handleSelectShape = (type, svgData = null) => {
    let newShape = null;
    
    // Calculate center of visible canvas (accounts for pan offset)
    const centerX = -stagePosition.x + stageSize.width / 2;
    const centerY = -stagePosition.y + stageSize.height / 2;

    if (type === 'TEXT') {
      newShape = {
        id: uuidv4(),
        type: 'TEXT',
        x: centerX, y: centerY,
        text: 'Double click to edit', 
        fontSize: 16, fontFamily: 'Arial', align: 'left', 
        fontStyle: 'normal', textDecoration: '', fill: '#000000',
        width: 250, rotation: 0 
      };
    } else if (type === 'SVG_PATH') {
      newShape = { 
        id: uuidv4(), 
        type: 'SVG_PATH', 
        x: centerX, y: centerY, 
        data: svgData, 
        fill: 'none', stroke: '#000000', strokeWidth: 2,
        scaleX: 1, scaleY: 1, rotation: 0 
      };
    }

    if (!newShape) {
      alert('Shape type not supported: ' + type);
      return;
    }

    const updatedShapes = [...shapes, newShape];
    setShapes(updatedShapes);
    commitToHistory(updatedShapes); // Lưu vào lịch sử để Undo được
    if (socket) socket.emit('send-shape', newShape);
    
    setMode('select'); 
    setSelectedId(newShape.id);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete the entire drawing board?")) {
      setShapes([]);
      commitToHistory([]);
      setSelectedId(null);
    }
  };

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    // Check if user clicked on empty area (not on any shape)
    const isOverlay = e.target.id() === 'drawing-overlay';
    const clickedOnEmpty = e.target === stage || isOverlay;

    if (clickedOnEmpty) setSelectedId(null);
    
    // In select mode, allow panning by dragging on empty space
    if (mode === 'select' && clickedOnEmpty) {
      isPanning.current = true;
      lastPointerPos.current = pointerPos;
      return;
    }

    if (mode === 'select') return;

    isDrawing.current = true;
    const pos = stage.getPointerPosition();

    const newLine = { 
      id: uuidv4(), 
      type: 'LINE', 
      tool: mode, 
      points: [pos.x, pos.y, pos.x, pos.y], 
      stroke: mode === 'eraser' ? '#ffffff' : brushColor, 
      strokeWidth: brushSize,
      tension: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
      globalCompositeOperation: mode === 'eraser' ? 'destination-out' : 'source-over'
    };
    setShapes([...shapes, newLine]);
  };

  const handleMouseMove = (e) => {
    // Handle panning in select mode
    if (isPanning.current && mode === 'select') {
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      
      const deltaX = pointerPos.x - lastPointerPos.current.x;
      const deltaY = pointerPos.y - lastPointerPos.current.y;
      
      setStagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastPointerPos.current = pointerPos;
      return;
    }
    
    if (mode === 'select' || !isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    const lastShapes = [...shapes];
    const lastLine = lastShapes[lastShapes.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lastShapes.splice(lastShapes.length - 1, 1, lastLine);
    setShapes(lastShapes);
  };

  const handleMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      commitToHistory(shapes); // Lưu lại nét vẽ vào lịch sử khi nhả chuột
    }
  };

  const updateSelectedShape = (key, value) => {
    const newShapes = shapes.slice();
    const index = newShapes.findIndex(s => s.id === selectedId);
    if (index !== -1) {
      const updatedShape = { ...newShapes[index], [key]: value };
      newShapes[index] = updatedShape;
      setShapes(newShapes);
      commitToHistory(newShapes);

      // Emit the updated shape to the server
      if (socket) socket.emit('send-shape', updatedShape);
    }
  };

  const selectedShape = shapes.find(s => s.id === selectedId);

  // --- UI STYLES ---
  const appContainerStyle = { display: 'flex', width: '100%', height: '100%', overflow: 'hidden' };
  const sidebarStyle = { width: `${sidebarWidth}px`, backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 10px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10, overflowY: 'auto' };
  const canvasContainerStyle = { flex: 1, backgroundColor: '#ffffff', position: 'relative' };
  const buttonStyle = { padding: '10px 15px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' };

  return (
    <div ref={containerRef} style={appContainerStyle}>
      {showToolbar && (
        <div style={sidebarStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '15px', borderBottom: '2px dashed #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontFamily: 'Poppins, sans-serif', color: '#111827' }}>🎨 My Canvas</h2>
            <button 
              onClick={() => setShowToolbar(false)}
              title="Hide toolbar"
              style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f3f4f6', fontSize: '14px', fontWeight: 'bold', lineHeight: '1' }}
            >
              &lt;
            </button>
          </div>

        {/* TOOL SELECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={{...buttonStyle, borderRadius: '12px', borderColor: mode === 'select' ? '#3b82f6' : '#d1d5db'}} onClick={() => setMode('select')}>🖱️ Pointer</button>
          <button style={{...buttonStyle, borderRadius: '12px', borderColor: mode === 'pen' ? '#3b82f6' : '#d1d5db'}} onClick={() => { setMode('pen'); setSelectedId(null); }}>✏️ Drawing mode</button>
          <button style={{...buttonStyle, borderRadius: '12px', borderColor: mode === 'eraser' ? '#3b82f6' : '#d1d5db'}} onClick={() => { setMode('eraser'); setSelectedId(null); }}>🧽 Eraser</button>
        </div>

        {/* DYNAMIC SETTINGS AREA */}
        {(mode === 'pen' || mode === 'eraser' || selectedId || selectedTextBoxId) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            
            {/* 1. Brush/Eraser Settings */}
            {(mode === 'pen' || mode === 'eraser') && !selectedId && (
              <>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>BRUSH SETTINGS</div>
                {mode === 'pen' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px' }}>Color:</label>
                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} style={{ width: '100%', height: '30px', cursor: 'pointer', border: 'none' }} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px' }}>Size: {brushSize}px</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    
                    {/* Thanh kéo Slider */}
                    <input 
                      type="range" min="1" max="40" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                      style={{ flex: 1, cursor: 'pointer' }} 
                    />
                    
                    {/* Ô vuông chứa chấm tròn Preview */}
                    <div style={{ 
                      width: '40px', height: '40px', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', 
                      backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px',
                      flexShrink: 0 
                    }}>
                      <div style={{
                        width: `${brushSize}px`,
                        height: `${brushSize}px`,
                        backgroundColor: mode === 'eraser' ? '#e5e7eb' : brushColor, 
                        borderRadius: '50%',
                        transition: 'all 0.1s ease-out'
                      }} />
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* 2. Shape/Text Style Settings */}
            {selectedId && selectedShape && (
              <>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>STYLE SETTINGS</div>
                
                {/* Global Fill Color for Shapes & Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Color:</label>
                  <input 
                    type="color" 
                    value={selectedShape.fill || '#000000'} 
                    onChange={(e) => updateSelectedShape('fill', e.target.value)}
                    style={{ width: '100%', height: '32px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: '4px', padding: '0' }}
                  />
                </div>

                {/* Text Specific Options */}
                {selectedShape.type === 'TEXT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                    
                    {/* Font Size: Đổi từ Slider sang Number Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Size:</label>
                      <input 
                        type="number" 
                        min="8" max="150"
                        value={selectedShape.fontSize || 16} 
                        onChange={(e) => updateSelectedShape('fontSize', parseInt(e.target.value))}
                        style={{ width: '60px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      <span style={{ fontSize: '11px' }}>px</span>
                    </div>

                    {/* 👇 THÊM ĐOẠN NÀY ĐỂ CHỌN FONT CHỮ 👇 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Font:</label>
                      <select
                        value={selectedShape.fontFamily || 'Arial'}
                        onChange={(e) => updateSelectedShape('fontFamily', e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '13px',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Comic Sans MS">Comic Sans</option>
                      </select>
                    </div>

                    {/* Alignment: Giao diện giống Word + Justify */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Alignment:</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                          { id: 'left', path: 'M2 3h12v2H2z M2 7h8v2H2z M2 11h12v2H2z' },
                          { id: 'center', path: 'M2 3h12v2H2z M4 7h8v2H4z M2 11h12v2H2z' },
                          { id: 'right', path: 'M2 3h12v2H2z M6 7h10v2H6z M2 11h12v2H2z' },
                          { id: 'justify', path: 'M2 3h12v2H2z M2 7h12v2H2z M2 11h12v2H2z' }
                        ].map((align) => (
                          <button
                            key={align.id}
                            onClick={() => updateSelectedShape('align', align.id)}
                            style={{
                              flex: 1, padding: '6px', cursor: 'pointer', borderRadius: '4px',
                              border: selectedShape.align === align.id ? '2px solid #3b82f6' : '1px solid #ccc',
                              backgroundColor: selectedShape.align === align.id ? '#eff6ff' : '#fff',
                              color: selectedShape.align === align.id ? '#3b82f6' : '#4b5563',
                              display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}
                            title={`Align ${align.id}`}
                          >
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                              <path d={align.path} />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Các nút B, I, U */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        style={{ flex: 1, padding: '5px 10px', fontWeight: 'bold', borderRadius: '12px', border: selectedShape.fontStyle?.includes('bold') ? '2px solid #3b82f6' : '1px solid #ccc', backgroundColor: selectedShape.fontStyle?.includes('bold') ? '#eff6ff' : '#fff', cursor: 'pointer' }}
                        onClick={() => {
                          const current = selectedShape.fontStyle || '';
                          updateSelectedShape('fontStyle', current.includes('bold') ? current.replace('bold', '').trim() : `${current} bold`);
                        }}
                      >B</button>
                      <button 
                        style={{ flex: 1, padding: '5px 10px', fontStyle: 'italic', borderRadius: '12px', border: selectedShape.fontStyle?.includes('italic') ? '2px solid #3b82f6' : '1px solid #ccc', backgroundColor: selectedShape.fontStyle?.includes('italic') ? '#eff6ff' : '#fff', cursor: 'pointer' }}
                        onClick={() => {
                          const current = selectedShape.fontStyle || '';
                          updateSelectedShape('fontStyle', current.includes('italic') ? current.replace('italic', '').trim() : `${current} italic`);
                        }}
                      >I</button>
                      <button 
                        style={{ flex: 1, padding: '5px 10px', textDecoration: 'underline', borderRadius: '12px', border: selectedShape.textDecoration === 'underline' ? '2px solid #3b82f6' : '1px solid #ccc', backgroundColor: selectedShape.textDecoration === 'underline' ? '#eff6ff' : '#fff', cursor: 'pointer' }}
                        onClick={() => updateSelectedShape('textDecoration', selectedShape.textDecoration === 'underline' ? 'none' : 'underline')}
                      >U</button>
                    </div>
                  </div>
                )}

                {/* Outline Options for Shapes */}
                {selectedShape.type !== 'TEXT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px' }}>Outline:</label>
                      <input 
                        type="checkbox" 
                        checked={(selectedShape.strokeWidth || 0) > 0} 
                        onChange={(e) => updateSelectedShape('strokeWidth', e.target.checked ? 2 : 0)}
                      />
                    </div>
                    {(selectedShape.strokeWidth || 0) > 0 && (
                      <>
                        <input 
                          type="color" 
                          value={selectedShape.stroke || '#000000'} 
                          onChange={(e) => updateSelectedShape('stroke', e.target.value)}
                          style={{ width: '100%', height: '30px', cursor: 'pointer', border: 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px' }}>Outline Width: {selectedShape.strokeWidth}px</label>
                          <input 
                            type="range" 
                            min="1" 
                            max="20" 
                            value={selectedShape.strokeWidth} 
                            onChange={(e) => updateSelectedShape('strokeWidth', parseInt(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => {
                    const newShapesList = shapes.filter(s => s.id !== selectedId);
                    setShapes(newShapesList);
                    commitToHistory(newShapesList);
                    setSelectedId(null);
                  }}
                  style={{ ...buttonStyle, borderRadius: '12px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', justifyContent: 'center', marginTop: '10px' }}
                >
                  🗑️ Delete Selected
                </button>
              </>
            )}
          </div>
        )}

        <hr style={{ width: '100%', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ShapeSelector onSelectShape={handleSelectShape} />
        </div>

        <div style={{ flex: 1 }}></div>

        {/* Undo/Redo buttons - top priority */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button 
            style={{ 
              ...buttonStyle, flex: 1, justifyContent: 'center', 
              opacity: historyStep === 0 ? 0.5 : 1, 
              cursor: historyStep === 0 ? 'not-allowed' : 'pointer',
              borderRadius: '12px',
              backgroundColor: '#fef3c7',
              borderColor: '#fbbf24'
            }} 
            onClick={handleUndo}
            disabled={historyStep === 0}
            title="Undo (Hoàn tác)"
          >
            ↩️ Undo
          </button>
          
          <button 
            style={{ 
              ...buttonStyle, flex: 1, justifyContent: 'center', 
              opacity: historyStep === history.length - 1 ? 0.5 : 1, 
              cursor: historyStep === history.length - 1 ? 'not-allowed' : 'pointer',
              borderRadius: '12px',
              backgroundColor: '#fef3c7',
              borderColor: '#fbbf24'
            }} 
            onClick={handleRedo}
            disabled={historyStep === history.length - 1}
            title="Redo (Làm lại)"
          >
            ↪️ Redo
          </button>
        </div>

        {/* Reset View and Grid buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button 
            style={{ 
              ...buttonStyle, 
              borderRadius: '12px', 
              backgroundColor: '#e0e7ff',
              borderColor: '#6366f1',
              justifyContent: 'center',
              flex: 1
            }} 
            onClick={() => setStagePosition({ x: 0, y: 0 })}
            title="Reset map view"
          >
            🎯 Reset View
          </button>

          <button 
            style={{ 
              ...buttonStyle, 
              borderRadius: '12px', 
              backgroundColor: '#e0e7ff',
              borderColor: '#6366f1',
              justifyContent: 'center',
              flex: 1
            }} 
            onClick={() => setGridIndex((prev) => (prev + 1) % GRID_OPTIONS.length)}
          >
            {showGrid ? `📏 Grid: ${currentGridSize}px` : '📏 Grid: OFF'}
          </button>
        </div>

        <button style={{ ...buttonStyle, borderRadius: '12px', backgroundColor: '#fee2e2', color: '#ef4444', justifyContent: 'center' }} onClick={handleClearAll}>
          🗑️ Clear All
        </button>

      </div>
      )}
      
      {!showToolbar && (
        <button 
          onClick={() => setShowToolbar(true)}
          title="Show toolbar"
          style={{ 
            position: 'fixed', 
            left: '10px', 
            top: '60px', 
            padding: '8px 12px', 
            cursor: 'pointer', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px', 
            backgroundColor: '#fff', 
            fontSize: '16px', 
            fontWeight: 'bold', 
            zIndex: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          &gt;
        </button>
      )}

      <div style={canvasContainerStyle}>
        <Stage
          x={stagePosition.x}
          y={stagePosition.y}
          width={stageSize.width} height={stageSize.height}
          style={{ cursor: mode === 'pen' ? 'crosshair' : (mode === 'eraser' ? 'cell' : (mode === 'select' ? 'grab' : 'default')), pointerEvents: 'auto' }}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
        >

          {showGrid && (
            <Layer listening={false}>
              {(() => {
                const lines = [];
                const gridColor = 'rgba(0, 0, 0, 0.16)';
                
                // Calculate visible grid bounds accounting for pan offset
                const startX = Math.floor(-stagePosition.x / currentGridSize) * currentGridSize;
                const endX = startX + stageSize.width + currentGridSize;
                const startY = Math.floor(-stagePosition.y / currentGridSize) * currentGridSize;
                const endY = startY + stageSize.height + currentGridSize;
                
                // Vẽ nét dọc (vertical lines)
                for (let i = startX; i < endX; i += currentGridSize) {
                  lines.push(
                    <Rect key={`v-${i}`} x={i} y={startY} width={1} height={endY - startY} fill={gridColor} />
                  );
                }
                // Vẽ nét ngang (horizontal lines)
                for (let j = startY; j < endY; j += currentGridSize) {
                  lines.push(
                    <Rect key={`h-${j}`} x={startX} y={j} width={endX - startX} height={1} fill={gridColor} />
                  );
                }
                return lines;
              })()}
            </Layer>
          )}

          <Layer>
            {shapes.map((shape, i) => (
              <ShapeRenderer
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedId}
                outlineThickness={outlineThickness}
                onSelect={() => { if(mode === 'select') setSelectedId(shape.id); }}
                onChange={(newAttrs) => {
                  const snappedAttrs = showGrid ? {
                    ...newAttrs,
                    x: Math.round(newAttrs.x / currentGridSize) * currentGridSize,
                    y: Math.round(newAttrs.y / currentGridSize) * currentGridSize,
                  } : newAttrs;

                  const newShapes = [...shapes];
                  newShapes[i] = snappedAttrs;
                  setShapes(newShapes);
                  commitToHistory(newShapes);

                  if (socket) socket.emit('send-shape', snappedAttrs); // Send updated shape to server
                }}
              />
            ))}

            {mode !== 'select' && (
              <Rect
                id="drawing-overlay"
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                fill="transparent"
              />
            )}

          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default Whiteboard;