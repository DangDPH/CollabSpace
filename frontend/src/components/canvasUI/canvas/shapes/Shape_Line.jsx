import React, { useRef, useEffect } from 'react';
import { Line, Transformer } from 'react-konva';

// this is for pencil
const LineShape = ({ shapeProps, isSelected, onSelect, onChange, outlineThickness }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Line
        ref={shapeRef}
        points={shapeProps.points}       // array of x,y coordinates
        stroke={shapeProps.stroke}       // color of the line
        strokeWidth={shapeProps.strokeWidth} // thickness
        tension={0.5}                    // smoothness of line
        lineCap="round"                  // caps at the end of lines
        lineJoin="round"                 // smooth corners
        globalCompositeOperation={
          shapeProps.tool === 'eraser' ? 'destination-out' : 'source-over'
        }
        onClick={onSelect}
        onTap={onSelect}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
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

export default LineShape;