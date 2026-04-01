import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const DEFAULT_BOXES = [
  {
    id: 1,
    x: 220,
    y: 140,
    width: 420,
    height: 220,
    content:
      "<h2>Title</h2><p>Double click on canvas to add more text boxes.</p>",
  },
];

function TextEditor({ addBoxSignal }) {
  const [boxes, setBoxes] = useState(() => {
    const saved = localStorage.getItem("canvas-text-boxes");
    return saved ? JSON.parse(saved) : DEFAULT_BOXES;
  });

  const [selectedId, setSelectedId] = useState(boxes[0]?.id ?? null);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem("canvas-text-boxes", JSON.stringify(boxes));
  }, [boxes]);

  useEffect(() => {
    if (!addBoxSignal) return;

    const newBox = {
      id: Date.now(),
      x: 180,
      y: 120,
      width: 420,
      height: 220,
      content: "<p>New text box</p>",
    };

    setBoxes((prev) => [...prev, newBox]);
    setSelectedId(newBox.id);
  }, [addBoxSignal]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
      ["link"],
      ["clean"],
    ],
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  const createBoxAt = (x, y) => {
    const newBox = {
      id: Date.now(),
      x,
      y,
      width: 420,
      height: 220,
      content: "<p>New text box</p>",
    };

    setBoxes((prev) => [...prev, newBox]);
    setSelectedId(newBox.id);
  };

  const handleCanvasDoubleClick = (e) => {
    if (e.target.closest(".text-box")) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    createBoxAt(e.clientX - canvasRect.left - 180, e.clientY - canvasRect.top - 60);
  };

  const handleDragStart = (e, box) => {
    e.stopPropagation();
    setSelectedId(box.id);
    setDraggingId(box.id);
    setDragOffset({
      x: e.clientX - box.x,
      y: e.clientY - box.y,
    });
  };

  const handleResizeStart = (e, box) => {
    e.stopPropagation();
    setSelectedId(box.id);
    setResizingId(box.id);
  };

  const handleMouseMove = (e) => {
    if (draggingId) {
      setBoxes((prev) =>
        prev.map((box) =>
          box.id === draggingId
            ? {
                ...box,
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
              }
            : box
        )
      );
    }

    if (resizingId) {
      setBoxes((prev) =>
        prev.map((box) =>
          box.id === resizingId
            ? {
                ...box,
                width: Math.max(280, e.clientX - box.x),
                height: Math.max(160, e.clientY - box.y),
              }
            : box
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  const updateContent = (id, content) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === id ? { ...box, content } : box))
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const active = document.activeElement;
        const tag = active?.tagName?.toLowerCase();

        if (tag === "input" || tag === "textarea" || active?.isContentEditable) {
          return;
        }

        setBoxes((prev) => prev.filter((box) => box.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectedId]);

  return (
    <div
      style={styles.canvas}
      onDoubleClick={handleCanvasDoubleClick}
      onMouseMove={handleMouseMove}
      onClick={() => setSelectedId(null)}
    >
      <div style={styles.hint}>
        Double click to create a text box • Click to select • Drag top bar •
        Resize bottom-right • Delete to remove
      </div>

      {boxes.map((box) => (
        <div
          key={box.id}
          className="text-box"
          style={{
            ...styles.textBox,
            top: box.y,
            left: box.x,
            width: box.width,
            border:
              selectedId === box.id
                ? "2px solid #4da6ff"
                : "1px solid #d8dde6",
            boxShadow:
              selectedId === box.id
                ? "0 16px 32px rgba(77,166,255,0.18)"
                : "0 10px 24px rgba(15, 23, 42, 0.12)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(box.id);
          }}
        >
          <div
            style={styles.dragBar}
            onMouseDown={(e) => handleDragStart(e, box)}
          >
            <span>Text Box</span>
            <div style={styles.badges}>
              <span style={styles.badge}>Drag</span>
              <span
                style={styles.deleteBadge}
                onClick={(e) => {
                  e.stopPropagation();
                  setBoxes((prev) => prev.filter((b) => b.id !== box.id));
                  if (selectedId === box.id) setSelectedId(null);
                }}
              >
                Delete
              </span>
            </div>
          </div>

          <div style={styles.editorWrap}>
            <ReactQuill
              theme="snow"
              value={box.content}
              onChange={(content) => updateContent(box.id, content)}
              modules={modules}
              formats={formats}
              placeholder="Type here..."
            />
          </div>

          <div
            style={styles.resizeHandle}
            onMouseDown={(e) => handleResizeStart(e, box)}
            title="Resize"
          />
        </div>
      ))}
    </div>
  );
}

const styles = {
  canvas: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "auto",
    background: "#eef2f7",
    backgroundImage:
      "radial-gradient(circle, rgba(120,130,150,0.18) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
  },

  hint: {
    position: "sticky",
    top: 18,
    margin: "18px auto 0",
    width: "fit-content",
    zIndex: 20,
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #dde3ec",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 13,
    color: "#475569",
    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
    backdropFilter: "blur(8px)",
  },

  textBox: {
    position: "absolute",
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    minWidth: 280,
    minHeight: 160,
  },

  dragBar: {
    height: 38,
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    cursor: "move",
    userSelect: "none",
    color: "#334155",
    fontSize: 13,
    fontWeight: 600,
  },

  badges: {
    display: "flex",
    gap: 6,
  },

  badge: {
    fontSize: 12,
    color: "#64748b",
    background: "#e2e8f0",
    padding: "2px 8px",
    borderRadius: 999,
  },

  deleteBadge: {
    fontSize: 12,
    color: "#b91c1c",
    background: "#fee2e2",
    padding: "2px 8px",
    borderRadius: 999,
    cursor: "pointer",
  },

  editorWrap: {
    background: "#fff",
  },

  resizeHandle: {
    position: "absolute",
    width: 14,
    height: 14,
    right: 6,
    bottom: 6,
    background: "#4da6ff",
    borderRadius: 4,
    cursor: "nwse-resize",
  },
};

export default TextEditor;