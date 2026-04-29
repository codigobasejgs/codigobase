"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Code,
  Code2,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { useCallback, useRef } from "react";

const lowlight = createLowlight(common);

type Props = {
  value?: JSONContent;
  onChange?: (json: JSONContent, html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, placeholder = "Escreva o conteúdo..." }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] px-5 py-4 text-sm leading-7 text-[#EDF2F7] focus:outline-none prose-invert",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getHTML());
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) return;
      const { url } = await res.json();
      editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    },
    [editor]
  );

  const handleImageClick = () => fileInputRef.current?.click();

  const setLink = useCallback(() => {
    const url = window.prompt("URL do link:");
    if (!url) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const toolbarBtn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    title: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition ${
        active
          ? "bg-[#00C8E8]/15 text-[#00C8E8]"
          : "text-[#7A8BA8] hover:bg-[#1A2236] hover:text-[#EDF2F7]"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#243352] bg-[#0A0E1A]">
      <div className="flex flex-wrap gap-1 border-b border-[#243352] bg-[#111827] px-3 py-2">
        {toolbarBtn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, "Negrito")}
        {toolbarBtn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, "Itálico")}
        {toolbarBtn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />, "Título H2")}
        {toolbarBtn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="h-4 w-4" />, "Título H3")}
        {toolbarBtn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, "Lista")}
        {toolbarBtn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, "Lista numerada")}
        {toolbarBtn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <Code className="h-4 w-4" />, "Código inline")}
        {toolbarBtn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), <Code2 className="h-4 w-4" />, "Bloco de código")}
        {toolbarBtn(editor.isActive("link"), setLink, <LinkIcon className="h-4 w-4" />, "Inserir link")}
        {toolbarBtn(false, handleImageClick, <ImageIcon className="h-4 w-4" />, "Inserir imagem")}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
          e.target.value = "";
        }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
