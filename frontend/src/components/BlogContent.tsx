import sanitize from "sanitize-html";

type BlogContentProps = {
  content: string;
  id: string;
};

export default function BlogContent({ content, id }: BlogContentProps) {
  const sanitizeHtml =
    typeof sanitize === "function"
      ? sanitize
      : (sanitize as unknown as { default: typeof sanitize }).default;

  const cleanHtml = sanitizeHtml(content || "", {
    allowedTags: [
      ...(sanitizeHtml.defaults.allowedTags || []),
      "h1",
      "h2",
      "h3",
      "img",
      "pre",
      "code",
      "u",
      "s",
      "span",
      "sub",
      "sup",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      blockquote: ["class"],
      p: ["class"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      li: ["class", "data-list"],
      pre: ["class", "data-language"],
      code: ["class"],
      span: ["class"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });

  return (
    <div
      id={id}
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
