import { Highlight, themes } from "prism-react-renderer";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui";

const LANG: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  py: "python",
  python: "python",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  java: "java",
  html: "markup",
  css: "css",
  sql: "sql",
  bash: "bash",
  mysql: "sql",
  postgresql: "sql",
  sqlite: "sql",
};

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const lang = LANG[language.toLowerCase()] || "javascript";
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
        <span>{language}</span>
        <Button
          variant="ghost"
          className="h-8 px-2"
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast.success("Copied");
          }}
        >
          <Copy size={14} /> Copy
        </Button>
      </div>
      <Highlight theme={themes.nightOwl} code={code} language={lang as "javascript"}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} overflow-auto p-4 text-sm`} style={{ ...style, margin: 0, background: "transparent" }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
