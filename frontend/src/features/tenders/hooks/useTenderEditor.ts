import { useEditor, Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useEffect, useState, useRef } from "react";
import { JSONContent } from "@tiptap/core";

interface UseTenderEditorProps {
  initialContent: JSONContent;
  onUpdate: (content: JSONContent) => void;
  debounceMs?: number;
}

export function useTenderEditor({ initialContent, onUpdate, debounceMs = 500 }: UseTenderEditorProps) {
  const [isSaved, setIsSaved] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Start typing...",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      setIsSaved(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const json = editor.getJSON();
        onUpdateRef.current(json);
        setIsSaved(true);
      }, debounceMs);
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const clearDebounce = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsSaved(true);
  };

  return { editor, isSaved, clearDebounce };
}
