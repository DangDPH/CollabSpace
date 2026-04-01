import React, { useState } from 'react';

// Configuration for all shapes available in the picker
const SHAPE_CATEGORIES = [
  {
    categoryName: 'Rectangles',
    shapes: [
      { id: 'square', icon: '■', type: 'SVG_PATH', data: 'M 0 0 H 100 V 100 H 0 Z' },
      { id: 'rect', icon: '▭', type: 'SVG_PATH', data: 'M 0 0 H 100 V 100 H 0 Z' },
      { id: 'rect_round', icon: '▢', type: 'SVG_PATH', data: 'M 20,0 H 80 A 20,20 0 0 1 100,20 V 80 A 20,20 0 0 1 80,100 H 20 A 20,20 0 0 1 0,80 V 20 A 20,20 0 0 1 20,0' },
      { id: 'rect_cut', icon: '◪', type: 'SVG_PATH', data: 'M 20 0 L 100 0 L 100 100 L 0 100 L 0 20 Z' },
      {id: 'rect_fold', icon: '▣', type: 'SVG_PATH', data: 'M 0 0 H 80 L 100 20 V 100 H 0 Z M 80 0 V 20 H 100'}
    ]
  },

  {
    categoryName: 'Lines',
    shapes: [
      { id: 'straight_line', icon: '-', type: 'SVG_PATH', data: 'M 0 50 L 100 50' },
      { id: 'arrow_right', icon: '→', type: 'SVG_PATH', data: 'M 0 50 L 80 50 M 80 50 L 70 40 M 80 50 L 70 60' },
      { id: 'arrow_left', icon: '←', type: 'SVG_PATH', data: 'M 100 50 L 20 50 M 20 50 L 30 40 M 20 50 L 30 60' },
      { id: 'arrow_up', icon: '↑', type: 'SVG_PATH', data: 'M 50 100 L 50 20 M 50 20 L 40 30 M 50 20 L 60 30' },
      { id: 'arrow_down', icon: '↓', type: 'SVG_PATH', data: 'M 50 0 L 50 80 M 50 80 L 40 70 M 50 80 L 60 70' },
    ]
  },

  {
    categoryName: 'Basic Shapes',
    shapes: [
      { id: 'circle', icon: '●', type: 'SVG_PATH', data: 'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0' },
      { id: 'ellipse', icon: '⬭', type: 'SVG_PATH', data: 'M 50,20 A 50,30 0 1,1 50,80 A 50,30 0 1,1 50,20' },
      { id: 'triangle', icon: '▲', type: 'SVG_PATH', data: 'M 50 0 L 100 100 L 0 100 Z' },
      { id: 'right_triangle', icon: '◢', type: 'SVG_PATH', data: 'M 0 0 L 100 100 L 0 100 Z' },
      { id: 'diamond', icon: '◆', type: 'SVG_PATH', data: 'M 50 0 L 100 50 L 50 100 L 0 50 Z' },
      { id: 'parallelogram', icon: '▱', type: 'SVG_PATH', data: 'M 25 0 L 100 0 L 75 100 L 0 100 Z' },
      { id: 'trapezoid', icon: '⏢', type: 'SVG_PATH', data: 'M 20 0 L 80 0 L 100 100 L 0 100 Z' },
      { id: 'hexagon', icon: '⬡', type: 'SVG_PATH', data: 'M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z' },
      { id: 'octagon', icon: '⯃', type: 'SVG_PATH', data: 'M 30 0 L 70 0 L 100 30 L 100 70 L 70 100 L 30 100 L 0 70 L 0 30 Z' },
    ]
  },
  {
    categoryName: 'Block Arrows',
    shapes: [
      { id: 'arrow_right', icon: '⇨', type: 'SVG_PATH', data: 'M 0 25 L 50 25 L 50 0 L 100 50 L 50 100 L 50 75 L 0 75 Z' },
      { id: 'arrow_left', icon: '⇦', type: 'SVG_PATH', data: 'M 100 25 L 50 25 L 50 0 L 0 50 L 50 100 L 50 75 L 100 75 Z' },
      { id: 'arrow_up', icon: '⇧', type: 'SVG_PATH', data: 'M 25 100 L 25 50 L 0 50 L 50 0 L 100 50 L 75 50 L 75 100 Z' },
      { id: 'arrow_down', icon: '⇩', type: 'SVG_PATH', data: 'M 25 0 L 25 50 L 0 50 L 50 100 L 100 50 L 75 50 L 75 0 Z' },
      { id: 'arrow_double', icon: '↔️', type: 'SVG_PATH', data: 'M 0 50 L 25 25 V 40 H 75 V 25 L 100 50 L 75 75 V 60 H 25 V 75 Z' },
    ]
  },
  {
    categoryName: 'Text',
    shapes: [
      { id: 'text_box', icon: 'A', type: 'TEXT' }
    ]
  },
  {
    categoryName: 'Equation Shapes',
    shapes: [
      { id: 'plus', icon: '+', type: 'SVG_PATH', data: 'M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z' },
      { id: 'minus', icon: '-', type: 'SVG_PATH', data: 'M 0 35 L 100 35 L 100 65 L 0 65 Z' },
      { id: 'multiply', icon: '✖', type: 'SVG_PATH', data: 'M 20 0 L 50 30 L 80 0 L 100 20 L 70 50 L 100 80 L 80 100 L 50 70 L 20 100 L 0 80 L 30 50 L 0 20 Z' },
      { id: 'divide', icon: '➗', type: 'SVG_PATH', data: 'M 40 0 A 10 10 0 1 1 60 0 A 10 10 0 1 1 40 0 M 0 45 L 100 45 L 100 55 L 0 55 Z M 40 100 A 10 10 0 1 1 60 100 A 10 10 0 1 1 40 100' },
    ]
  }
];

const ShapeSelector = ({ onSelectShape }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Layout Styles
  const containerStyle = { position: 'relative', display: 'inline-block', width: '100%' };
  const toggleButtonStyle = {
    width: '100%', padding: '10px', cursor: 'pointer',
    backgroundColor: isOpen ? '#eff6ff' : '#f9fafb',
    border: '1px solid', borderColor: isOpen ? '#3b82f6' : '#d1d5db',
    borderRadius: '6px', textAlign: 'left', fontWeight: 'bold',
    display: 'flex', justifyContent: 'space-between',
    borderRadius: '12px'
  };

  const dropdownStyle = {
    position: 'absolute', top: '100%', left: 0, marginTop: '5px',
    width: '100%', boxSizing: 'border-box', maxHeight: '400px', overflowY: 'auto',
    backgroundColor: 'white', border: '1px solid #d1d5db',
    borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 50, padding: '10px'
  };

  const categoryTitleStyle = { fontSize: '12px', fontWeight: 'bold', color: '#4b5563', margin: '10px 0 5px 0', textTransform: 'uppercase' };

  // Grid layout that wraps icons to the next line instead of using a horizontal scrollbar
  const gridWrapStyle = { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', // This allows icons to push to the next row when they exceed width
    gap: '4px', 
    paddingBottom: '5px 0' 
  };

  const itemStyle = {
    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: '1px solid transparent', borderRadius: '4px', fontSize: '18px',
    transition: 'all 0.2s', backgroundColor: '#f9fafb'
  };

  return (
    <div style={containerStyle}>
      {/* Dropdown Toggle Button */}
      <button style={toggleButtonStyle} onClick={() => setIsOpen(!isOpen)}>
        <span>⭐ Shapes</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Shapes Dropdown Panel */}
      {isOpen && (
        <div style={dropdownStyle}>
          {SHAPE_CATEGORIES.map((category, index) => (
            <div key={index}>
              <div style={categoryTitleStyle}>{category.categoryName}</div>
              
              {/* This container will wrap icons to the next line automatically */}
              <div style={gridWrapStyle}>
                {category.shapes.map((shape) => (
                  <button
                    key={shape.id}
                    style={itemStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onClick={() => {
                      // Passing the type and data (for SVG_PATH) back to Whiteboard
                      // For TEXT type, data is undefined which is fine
                      onSelectShape(shape.type, shape.data); 
                      setIsOpen(false); 
                    }}
                    title={shape.id}
                  >
                    {shape.icon}
                  </button>
                ))}
              </div>
              
              {/* Divider between categories */}
              {index < SHAPE_CATEGORIES.length - 1 && (
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0 0 0' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShapeSelector;