import { Editor } from "@tiptap/react";
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3, Undo, Redo, Table as TableIcon } from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const toggleLetteredList = () => {
    // Tiptap doesn't have native "lettered list". We use ordered list with a custom class
    editor.chain().focus().toggleOrderedList().run();
    if (editor.isActive("orderedList")) {
      editor.commands.updateAttributes("orderedList", { class: "lettered-list" });
    }
  };

  return (
    <div style={{ display: "flex", gap: "6px", padding: "8px", borderBottom: "1px solid #eee", flexWrap: "wrap", alignItems: "center" }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`btn-toolbar ${editor.isActive("bold") ? "active" : ""}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`btn-toolbar ${editor.isActive("italic") ? "active" : ""}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`btn-toolbar ${editor.isActive("strike") ? "active" : ""}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      
      <div style={{ width: "1px", height: "16px", backgroundColor: "#ddd", margin: "0 4px" }} />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`btn-toolbar ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`btn-toolbar ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>

      <div style={{ width: "1px", height: "16px", backgroundColor: "#ddd", margin: "0 4px" }} />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`btn-toolbar ${editor.isActive("bulletList") ? "active" : ""}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`btn-toolbar ${editor.isActive("orderedList") && !editor.getAttributes("orderedList").class?.includes("lettered") ? "active" : ""}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={toggleLetteredList}
        className={`btn-toolbar ${editor.isActive("orderedList") && editor.getAttributes("orderedList").class?.includes("lettered") ? "active" : ""}`}
        title="Lettered List (a, b, c)"
      >
        <span style={{ fontWeight: 600, fontSize: 14, fontFamily: "serif" }}>a,b,c</span>
      </button>

      <div style={{ width: "1px", height: "16px", backgroundColor: "#ddd", margin: "0 4px" }} />

      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="btn-toolbar"
        title="Insert Table"
      >
        <TableIcon size={16} />
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="btn-toolbar"
        title="Undo"
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="btn-toolbar"
        title="Redo"
      >
        <Redo size={16} />
      </button>
    </div>
  );
}
