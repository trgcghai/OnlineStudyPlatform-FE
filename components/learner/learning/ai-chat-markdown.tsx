import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiChatMarkdownProps {
  content: string;
}

const REMARK_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h3 className="pt-1 text-base font-semibold text-foreground">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="pt-1 text-base font-semibold text-foreground">{children}</h3>
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
  table: ({ children }) => (
    <div className="max-w-full overflow-x-auto rounded-lg border">
      <table className="min-w-full border-collapse text-left text-xs">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-background/80 px-3 py-2 font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b px-3 py-2 align-top last:border-b-0">{children}</td>
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
};

export function AiChatMarkdown({ content }: AiChatMarkdownProps) {
  return (
    <div className="min-w-0 space-y-2 text-sm leading-6 [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        skipHtml
        disallowedElements={["img"]}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
