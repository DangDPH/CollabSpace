import React, { useState, useEffect, useRef } from 'react';
import { Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';

const Shape_Text = ({ shapeProps, isSelected, onSelect, onChange, outlineThickness }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isSelected && !isEditing) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing]);

  useEffect(() => {
  if (shapeRef.current) {
    shapeRef.current.getLayer()?.batchDraw();
  }
  }, [shapeProps.text]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    onSelect(); 
  };

  return (
    <React.Fragment>
      <Text
        ref={shapeRef}
        {...shapeProps}
        text={shapeProps.text}
        visible={!isEditing}
        draggable={!isEditing}
        onClick={onSelect}
        onDblClick={handleDoubleClick}

        wrap='word'
        width={shapeProps.width}
        height={shapeProps.height}

        onDragEnd={(e) => {
          onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),

            width: Math.max(5, node.width() * scaleX),
            rotation: node.rotation(),
          });
          
          node.scaleX(1);
          node.scaleY(1);
        }}
      />

      {isEditing && (
        <Html>
          <textarea
            value={shapeProps.text}
            onChange={(e) => {
              const textarea = e.target;
              textarea.style.height = 'auto';
              textarea.style.height = textarea.scrollHeight + 'px';

              onChange({ ...shapeProps, 
                text: textarea.value,
                height: textarea.scrollHeight, })
              }}
            onBlur={() => setIsEditing(false)}
            style={{
              position: 'absolute',
              top: `${shapeProps.y}px`,
              left: `${shapeProps.x}px`,
              width: `${shapeProps.width}px`,
              height: 'auto',
              fontSize: `${shapeProps.fontSize}px`,
              border: '1px dashed #3b82f6',
              overflow: 'hidden',
              resize: 'none',
            }}
            autoFocus
          />
        </Html>
      )}

      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']}
          borderStrokeWidth={outlineThickness}
          borderStroke='#7FB9F9'
        />
      )}
    </React.Fragment>
  );
};

export default Shape_Text;