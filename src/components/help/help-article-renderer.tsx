import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function HelpArticleRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-6 text-[15px] leading-7 text-[#3F3F46] [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:leading-7 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-3 [&_th]:border [&_th]:border-border [&_th]:bg-muted/45 [&_th]:p-3 [&_th]:text-left [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
