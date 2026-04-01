import '../../board.css';

export default function Resizer({ onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="panel-resizer"
      title="Drag to resize panel"
    />
  );
}