import React, { useState, useRef, useEffect } from 'react';

const TextBox = ({
  box,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragBarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    onSelect(box.id);
    setDragOffset({
      x: e.clientX - box.x,
      y: e.clientY - box.y,
    });
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    onSelect(box.id);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging) {
        onUpdate({
          ...box,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
      if (resizing) {
        onUpdate({
          ...box,
          width: Math.max(200, e.clientX - box.x),
          height: Math.max(100, e.clientY - box.y),
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, box, dragOffset, onUpdate]);

  return (
    <div
      style={{
        ...styles.container,
        top: box.y,
        left: box.x,
        width: box.width,
        height: box.height,
        border: isSelected ? '2px solid #4da6ff' : '1px solid #d8dde6',
        boxShadow: isSelected
          ? '0 16px 32px rgba(77,166,255,0.18)'
          : '0 10px 24px rgba(15, 23, 42, 0.12)',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(box.id);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Drag Bar */}
      <div
        ref={dragBarRef}
        style={styles.dragBar}
        onMouseDown={handleDragStart}
      >
        <span>Text Box</span>
        <span style={styles.badge}>Drag</span>
      </div>

      {/* Textarea */}
      <textarea
        value={box.content}
        onChange={(e) => {
          e.stopPropagation();
          onUpdate({
            ...box,
            content: e.target.value,
          });
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          ...styles.textarea,
          fontSize: `${box.fontSize}px`,
          fontFamily: box.fontFamily,
          textAlign: box.textAlign,
          fontWeight: box.bold ? 'bold' : 'normal',
          fontStyle: box.italic ? 'italic' : 'normal',
          textDecoration: box.underline ? 'underline' : 'none',
          color: box.color,
        }}
        placeholder="Type text here..."
      />

      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        style={styles.resizeHandle}
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      />
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    userSelect: 'none',
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
    flexShrink: 0,
  },
  badge: {
    fontSize: 12,
    color: '#64748b',
    background: '#e2e8f0',
    padding: '2px 8px',
    borderRadius: 999,
  },
  textarea: {
    flex: 1,
    border: 'none',
    padding: '12px',
    fontFamily: 'Arial',
    resize: 'none',
    outline: 'none',
    fontSize: '16px',
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
  },
};

export default TextBox;
