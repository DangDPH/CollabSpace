import '../../board.css';

export default function Toolbar({ setMode }) {
  return (
    <div className="board-toolbar">
      <button
        onClick={() => setMode("canvas")}
        className="toolbar-btn bg-orange"
      >
        Canvas
      </button>

      <button
        onClick={() => setMode("text")}
        className="toolbar-btn bg-blue"
      >
        Text
      </button>

      <button
        onClick={() => setMode("split")}
        className="toolbar-btn bg-pink"
      >
        Split
      </button>
    </div>
  );
}