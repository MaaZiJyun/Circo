export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <article className="space-y-3 text-sm leading-7 text-zinc-800 dark:text-zinc-200">
      {lines.map((line, index) => {
        const page = line.match(/^<!-- Page (\d+) -->$/);
        if (page)
          return (
            <div
              key={index}
              className="my-6 border-b border-zinc-200 pb-1 text-xs text-zinc-400 dark:border-zinc-800"
            >
              Page {page[1]}
            </div>
          );
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const className =
            heading[1].length === 1
              ? "text-2xl font-bold"
              : heading[1].length === 2
                ? "text-xl font-semibold"
                : "text-lg font-semibold";
          return (
            <h2 key={index} className={className}>
              {heading[2]}
            </h2>
          );
        }
        const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (image)
          return (
            // Extracted PDF images have intrinsic dimensions unavailable in Markdown.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={image[2]}
              alt={image[1]}
              loading="lazy"
              className="mx-auto max-h-[36rem] max-w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
            />
          );
        if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) return null;
        if (/^\|.*\|$/.test(line)) {
          const cells = line
            .slice(1, -1)
            .split(/(?<!\\)\|/)
            .map((cell) => cell.trim().replaceAll("\\|", "|"));
          return (
            <div
              key={index}
              className="grid min-w-max border-x border-b border-zinc-200 first:border-t dark:border-zinc-700"
              style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(8rem, 1fr))` }}
            >
              {cells.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className="border-r border-zinc-200 px-3 py-1.5 last:border-r-0 dark:border-zinc-700"
                >
                  {cell}
                </div>
              ))}
            </div>
          );
        }
        if (/^[-*]\s+/.test(line))
          return (
            <div key={index} className="flex gap-2 pl-3">
              <span>•</span>
              <span>{line.replace(/^[-*]\s+/, "")}</span>
            </div>
          );
        if (/^>\s?/.test(line))
          return (
            <blockquote
              key={index}
              className="border-l-2 border-zinc-300 pl-4 text-zinc-500"
            >
              {line.replace(/^>\s?/, "")}
            </blockquote>
          );
        return line ? (
          <p key={index} className="whitespace-pre-wrap">
            {line}
          </p>
        ) : (
          <div key={index} className="h-2" />
        );
      })}
    </article>
  );
}
