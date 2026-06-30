import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Branded markdown renderer used by blog posts + legal pages.
const components = {
  h1: ({ node, ...p }) => <h1 className="font-display text-3xl font-bold text-brand-ink mt-10 mb-4 tracking-tight" {...p} />,
  h2: ({ node, ...p }) => <h2 className="font-display text-2xl font-bold text-brand-ink mt-9 mb-3 tracking-tight" {...p} />,
  h3: ({ node, ...p }) => <h3 className="font-display text-xl font-semibold text-brand-ink mt-7 mb-2" {...p} />,
  p: ({ node, ...p }) => <p className="text-brand-muted leading-relaxed my-4 text-[17px]" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc pl-6 my-4 space-y-2 text-brand-muted text-[17px]" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal pl-6 my-4 space-y-2 text-brand-muted text-[17px]" {...p} />,
  li: ({ node, ...p }) => <li className="leading-relaxed" {...p} />,
  a: ({ node, ...p }) => <a className="text-brand-green font-semibold hover:underline" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold text-brand-ink" {...p} />,
  blockquote: ({ node, ...p }) => <blockquote className="border-l-4 border-brand-green/40 pl-4 italic text-brand-muted my-5" {...p} />,
  img: ({ node, ...p }) => <img className="rounded-2xl my-6 w-full" loading="lazy" alt={p.alt || ""} {...p} />,
  table: ({ node, ...p }) => <div className="overflow-x-auto my-5"><table className="w-full text-left border-collapse text-[15px]" {...p} /></div>,
  th: ({ node, ...p }) => <th className="border-b border-brand-line py-2 pr-4 font-semibold text-brand-ink" {...p} />,
  td: ({ node, ...p }) => <td className="border-b border-brand-line/60 py-2 pr-4 text-brand-muted" {...p} />,
};

export default function Markdown({ children }) {
  return (
    <div data-testid="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
