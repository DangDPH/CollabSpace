import React, { useState, useEffect, useRef } from 'react';
import { Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';

const Shape_Text = ({ shapeProps, isSelected, onSelect, onChange, outlineThickness }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isSelected && !isEditing && trRef.current) {
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

        // synchronize text properties with konva Text attributes
        align={shapeProps.align || 'left'}
        lineHeight={1.2}
        padding={5}
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
            // do not width<30px to avoid collapsing text
            width: Math.max(30, node.width() * scaleX),
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
                height: textarea.scrollHeight 
              });
            }}
            onBlur={() => setIsEditing(false)}
            style={{
              position: 'absolute',
              top: `${shapeProps.y}px`,
              left: `${shapeProps.x}px`,
              width: `${shapeProps.width}px`,
              minHeight: '20px',
              fontSize: `${shapeProps.fontSize}px`,
              fontFamily: shapeProps.fontFamily,
              fontWeight: shapeProps.fontStyle?.includes('bold') ? 'bold' : 'normal',
              fontStyle: shapeProps.fontStyle?.includes('italic') ? 'italic' : 'normal',
              textDecoration: shapeProps.textDecoration,
              textAlign: shapeProps.align || 'left',
              color: shapeProps.fill,
              border: '1px dashed #3b82f6',
              background: 'transparent',
              outline: 'none',
              transform: `rotate(${shapeProps.rotation || 0}deg)`,
              transformOrigin: 'top left',
              
              // NEW ATTRIBUTES for synchronizing with konva Text
              lineHeight: 1.2,
              padding: '5px',
              margin: '0px',
              overflow: 'hidden',
              resize: 'none',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word'
            }}
            autoFocus
          />
        </Html>
      )}

      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          // HORIZONTAL DRAWING ONLY (vertical dragging will empty the text)
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            // lock for width being too small
            if (newBox.width < 30) return oldBox;
            return newBox;
          }}
          borderStrokeWidth={outlineThickness}
          borderStroke='#7FB9F9'
        />
      )}
    </React.Fragment>
  );
};

export default Shape_Text;