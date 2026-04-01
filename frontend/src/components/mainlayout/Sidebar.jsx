import '../../board.css';

export default function Sidebar() {
  return (
    <div className="board-sidebar">
      <button className="sidebar-icon-btn" title="Pencil">✏️</button>
      <button className="sidebar-icon-btn" title="Text">📝</button>
      <button className="sidebar-icon-btn" title="Square">⬜</button>
      <button className="sidebar-icon-btn" title="Triangle">🔺</button>
    </div>
  );
}