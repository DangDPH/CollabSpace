import React from 'react';
import ShapeLine from './shapes/Shape_Line';
import ShapeSVG from './shapes/Shape_SVG'; 
import ShapeText from './shapes/Shape_text.jsx';

// dictionary mapping type -> Component
const ShapeComponents = {
  LINE: ShapeLine,
  SVG_PATH: ShapeSVG, 
  TEXT: ShapeText,
  // Add other shape types here
};

const ShapeRenderer = ({ shape, isSelected, onSelect, onChange, outlineThickness }) => {
  // Find exact Component based on type
  const SpecificShape = ShapeComponents[shape.type];

  if (!SpecificShape) return null; // Ìf type not found, skip rendering

  return (
    <SpecificShape
      shapeProps={shape}
      isSelected={isSelected}
      onSelect={onSelect}
      onChange={onChange}
      outlineThickness={outlineThickness}
    />
  );
};

export default ShapeRenderer;