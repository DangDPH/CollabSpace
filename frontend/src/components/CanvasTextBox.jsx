import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CanvasTextBox = ({ 
  box, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  onMouseDown,
}) => {
  const textBoxRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', { 'align': [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'align',
    'list',
    'bullet',
    'link',
  ];

  const handleDragStart = (e) => {
    e.stopPropagation();
    onSelect(box.id);
    setDraggingId(box.id);
    setDragOffset({
      x: e.clientX - box.x,
      y: e.clientY - box.y,
    });
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    onSelect(box.id);
    setResizingId(box.id);
  };

  const handleMouseMove = (e) => {
    if (draggingId === box.id) {
      onUpdate({
        ...box,
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }

    if (resizingId === box.id) {
      onUpdate({
        ...box,
        width: Math.max(280, e.clientX - box.x),
        height: Math.max(160, e.clientY - box.y),
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  useEffect(() => {
    if (draggingId === box.id || resizingId === box.id) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, resizingId, box]);

  return (
    <div
      ref={textBoxRef}
      style={{
        ...styles.textBox,
        top: box.y,
        left: box.x,
        width: box.width,
        height: box.height,
        border: isSelected ? '2px solid #4da6ff' : '1px solid #d8dde6',
        boxShadow: isSelected
          ? '0 16px 32px rgba(77,166,255,0.18)'
          : '0 10px 24px rgba(15, 23, 42, 0.12)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('TextBox clicked, setting selectedTextBoxId to:', box.id);
        onSelect(box.id);
      }}
      onMouseDown={(e) => {
        // Prevent clicks on textbox from affecting canvas
        e.preventDefault();
        e.stopPropagation();
        onMouseDown?.(e);
      }}
      onKeyDown={(e) => {
        // Stop propagation of keyboard events
        e.stopPropagation();
      }}
    >
      {/* Drag Bar */}
      <div style={styles.dragBar} onMouseDown={handleDragStart}>
        <span>Text Box</span>
        <span style={styles.badge}>Drag</span>
      </div>

      {/* Editor Area */}
      <div style={styles.editorWrap}>
        <ReactQuill
          theme="snow"
          value={box.content || ''}
          onChange={(content) => onUpdate({ ...box, content })}
          modules={modules}
          formats={formats}
          placeholder="Type here..."
        />
      </div>

      {/* Resize Handle */}
      <div
        style={styles.resizeHandle}
        onMouseDown={handleResizeStart}
        title="Resize"
      />
    </div>
  );
};

const styles = {
  textBox: {
    position: 'absolute',
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 280,
    minHeight: 160,
    zIndex: 100,
    transition: 'all 0.2s',
    pointerEvents: 'auto',
  },

  dragBar: {
    height: 38,
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    cursor: 'move',
    userSelect: 'none',
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    pointerEvents: 'auto',
  },

  badge: {
    fontSize: 12,
    color: '#64748b',
    background: '#e2e8f0',
    padding: '2px 8px',
    borderRadius: 999,
    pointerEvents: 'auto',
  },

  editorWrap: {
    background: '#fff',
    height: 'calc(100% - 38px)',
    overflow: 'auto',
    pointerEvents: 'auto',
  },

  resizeHandle: {
    position: 'absolute',
    width: 14,
    height: 14,
    right: 6,
    bottom: 6,
    background: '#4da6ff',
    borderRadius: 4,
    cursor: 'nwse-resize',
    pointerEvents: 'auto',
  },
};

export default CanvasTextBox;
