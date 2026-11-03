/** Chunk text as one plain line, for previews */
export function plainText(markdown: string): string {
  return markdown
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>|]+|:?-{3,}:?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
