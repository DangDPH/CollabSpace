import React, { useRef, useEffect } from 'react';
import { Path, Transformer } from 'react-konva';

const Shape_SVG = ({ shapeProps, isSelected, onSelect, onChange, outlineThickness }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.borderStrokeWidth(outlineThickness);
      trRef.current.getLayer().batchDraw();
    }
  }, [outlineThickness]);

  return (
    <React.Fragment>
      <Path
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        
        stroke={shapeProps.stroke || 'black'}
        strokeWidth={shapeProps.strokeWidth || 2}
        hitStrokeWidth={10} // increase hit area for easier selection of thin paths

        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          
          // Với Path (SVG), ta giữ nguyên scale thay vì reset về 1 như Rect/Circle
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} borderStrokeWidth={outlineThickness} borderStroke='#7FB9F9' />}
    </React.Fragment>
  );
};

export default Shape_SVG;