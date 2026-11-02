"use client";

import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="min-h-105 animate-pulse rounded-xl bg-slate-50" />
  ),
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your story...",
}: {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="drafts-editor overflow-hidden rounded-xl">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
