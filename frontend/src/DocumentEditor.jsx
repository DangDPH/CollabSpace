import { useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const DEFAULT_CONTENT = `
  <h1>Project Notes</h1>
  <p>This is your document panel.</p>
  <ul>
    <li>Write long-form notes here</li>
    <li>Draft ideas</li>
    <li>Prepare structured content</li>
  </ul>
`;

function DocumentEditor() {
  const quillRef = useRef(null);
  const [content, setContent] = useState(
    localStorage.getItem("document-editor-content") || DEFAULT_CONTENT
  );

  const modules = useMemo(
    () => ({
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
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  const saveContent = (next) => {
    setContent(next);
    localStorage.setItem("document-editor-content", next);
  };

  const insertHtmlAtCursor = (html) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();
    editor.clipboard.dangerouslyPasteHTML(index, html);
    saveContent(editor.root.innerHTML);
  };

  const exportHtml = () => {
    const blob = new Blob(
      [
        `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Document Export</title>
</head>
<body>
${content}
</body>
</html>
        `,
      ],
      { type: "text/html;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document-export.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const undo = () => {
    const editor = quillRef.current?.getEditor();
    editor?.history.undo();
    if (editor) saveContent(editor.root.innerHTML);
  };

  const redo = () => {
    const editor = quillRef.current?.getEditor();
    editor?.history.redo();
    if (editor) saveContent(editor.root.innerHTML);
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Document</div>
          <div style={styles.subtitle}>Long-form writing panel</div>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.smallButton}
            onClick={() =>
              insertHtmlAtCursor(
                `<ol class="roman-list"><li>Item I</li><li>Item II</li></ol>`
              )
            }
          >
            Roman
          </button>

          <button
            style={styles.smallButton}
            onClick={() =>
              insertHtmlAtCursor(
                `<ul class="checklist"><li>Task 1</li><li>Task 2</li></ul>`
              )
            }
          >
            Checklist
          </button>

          <button style={styles.smallButton} onClick={undo}>
            Undo
          </button>

          <button style={styles.smallButton} onClick={redo}>
            Redo
          </button>

          <button style={styles.primaryButton} onClick={exportHtml}>
            Export
          </button>
        </div>
      </div>

      <div style={styles.editorArea}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={(value) => saveContent(value)}
          modules={modules}
          formats={formats}
          placeholder="Write your document here..."
        />
      </div>
    </div>
  );
}

const styles = {
  panel: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
  },

  header: {
    minHeight: 68,
    flexShrink: 0,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    background: "#f8fafc",
    gap: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  smallButton: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #dbe3ec",
    background: "#fff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 500,
  },

  primaryButton: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #0f62fe",
    background: "#0f62fe",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  editorArea: {
    flex: 1,
    overflow: "auto",
    background: "#fff",
    padding: "12px",
  },
};

export default DocumentEditor;