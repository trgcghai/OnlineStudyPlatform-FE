import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiChatMarkdownProps {
  content: string;
}

export function AiChatMarkdown({ content }: AiChatMarkdownProps) {
  return (
    <div className="min-w-0 space-y-2 break-words text-sm leading-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={["img"]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h3 className="pt-1 text-base font-semibold text-foreground">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="pt-1 text-base font-semibold text-foreground">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h3 className="pt-1 font-semibold text-foreground">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="ml-1 list-disc space-y-1 pl-4 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-1 list-decimal space-y-1 pl-4 marker:font-medium marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border bg-background/80 p-3 text-xs leading-relaxed [&>code]:bg-transparent [&>code]:p-0">
              {children}
            </pre>
          ),
          code: ({ children }) => (
            <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.9em]">
              {children}
            </code>
          ),
          hr: () => <hr className="border-border/70" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
