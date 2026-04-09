/**
 * Lightweight Markdown → HTML renderer for knowledge base entries.
 * Supports: headings, bold, italic, inline code, code blocks, links, lists, blockquotes, hr.
 */
export function useMarkdown() {
    function render(md: string): string {
        if (!md) return "";

        // Escape HTML to prevent XSS
        let html = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Fenced code blocks ```...```
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
            return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`;
        });

        // Process line by line for block elements
        const lines = html.split("\n");
        const result: string[] = [];
        let inList = false;
        let listType: "ul" | "ol" = "ul";

        for (const line of lines) {
            // Headings
            if (line.startsWith("### ")) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                }
                result.push(`<h3 class="md-h3">${inline(line.slice(4))}</h3>`);
                continue;
            }
            if (line.startsWith("## ")) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                }
                result.push(`<h2 class="md-h2">${inline(line.slice(3))}</h2>`);
                continue;
            }
            if (line.startsWith("# ")) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                }
                result.push(`<h1 class="md-h1">${inline(line.slice(2))}</h1>`);
                continue;
            }

            // Horizontal rule
            if (/^---+$/.test(line.trim())) {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                }
                result.push('<hr class="md-hr" />');
                continue;
            }

            // Blockquote
            if (line.startsWith("&gt; ") || line === "&gt;") {
                if (inList) {
                    result.push(`</${listType}>`);
                    inList = false;
                }
                const content = line.replace(/^&gt;\s?/, "");
                result.push(`<blockquote class="md-blockquote">${inline(content)}</blockquote>`);
                continue;
            }

            // Unordered list
            if (/^[-*]\s+/.test(line)) {
                if (!inList || listType !== "ul") {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ul class="md-ul">');
                    inList = true;
                    listType = "ul";
                }
                result.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
                continue;
            }

            // Ordered list
            if (/^\d+\.\s+/.test(line)) {
                if (!inList || listType !== "ol") {
                    if (inList) result.push(`</${listType}>`);
                    result.push('<ol class="md-ol">');
                    inList = true;
                    listType = "ol";
                }
                result.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
                continue;
            }

            // Close list if we hit a non-list line
            if (inList) {
                result.push(`</${listType}>`);
                inList = false;
            }

            // Empty line → paragraph break
            if (line.trim() === "") {
                result.push("<br />");
                continue;
            }

            // Regular paragraph
            result.push(`<p class="md-p">${inline(line)}</p>`);
        }

        if (inList) result.push(`</${listType}>`);

        return result.join("\n");
    }

    /** Process inline markdown: bold, italic, code, links, strikethrough */
    function inline(text: string): string {
        return (
            text
                // Inline code `code`
                .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
                // Bold **text** or __text__
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/__(.+?)__/g, "<strong>$1</strong>")
                // Italic *text* or _text_
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/_(.+?)_/g, "<em>$1</em>")
                // Strikethrough ~~text~~
                .replace(/~~(.+?)~~/g, "<del>$1</del>")
                // Links [text](url)
                .replace(
                    /\[([^\]]+)\]\(([^)]+)\)/g,
                    '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>',
                )
        );
    }

    return { render };
}
