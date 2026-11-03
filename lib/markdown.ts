/**
 * The parser's Markdown as a renderer should read it. It writes tables as
 * HTML with Markdown in their cells, which CommonMark leaves raw unless blank
 * lines set it apart; it writes display math on one line, which reads as
 * inline; and it writes dollar amounts and inline math with the same
 * unescaped `$`.
 */
export function prepareMarkdown(text: string): string {
  return escapeCurrency(
    text.replace(CELL, cellAsMarkdown).replace(DISPLAY_MATH, "$$$$\n$1\n$$$$")
  );
}

// `$$…$$` alone on its line is an equation of its own
const DISPLAY_MATH = /^[ \t]*\$\$(.+?)\$\$[ \t]*$/gm;

const CELL = /<(td|th)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;

// A cell starting like a list item or a heading is text, not a block
const BLOCK_START = /^(?:[-+*>#]|\d+[.)])(?=\s|$)/;

function cellAsMarkdown(
  _cell: string,
  tag: string,
  attributes: string | undefined,
  inner: string
): string {
  // Only punctuation escapes, so a numbered start escapes its `.` or `)`
  const content = inner
    .trim()
    .replace(BLOCK_START, (start) =>
      /\d/.test(start)
        ? `${start.slice(0, -1)}\\${start.slice(-1)}`
        : `\\${start}`
    );
  return `<${tag}${attributes ?? ""}>\n\n${content}\n\n</${tag}>`;
}

/**
 * Escapes each `$` that pandoc's rule says is no math delimiter: math opens
 * on a `$` with no space after it and closes on one with no space before it
 * and no digit after, so "$3.6 billion and $711 million" stays money.
 */
function escapeCurrency(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === "\\") {
      out += text.slice(i, i + 2);
      i += 2;
    } else if (char !== "$") {
      out += char;
      i++;
    } else if (text[i + 1] === "$") {
      const end = text.indexOf("$$", i + 2);
      const stop = end === -1 ? i + 2 : end + 2;
      out += end === -1 ? "\\$\\$" : text.slice(i, stop);
      i = stop;
    } else {
      const close = /\S/.test(text[i + 1] ?? "") ? closerOf(text, i + 1) : -1;
      out += close === -1 ? "\\$" : text.slice(i, close + 1);
      i = close === -1 ? i + 1 : close + 1;
    }
  }
  return out;
}

/** Where the inline math opened before `from` closes, or -1 when it doesn't */
function closerOf(text: string, from: number): number {
  for (let j = from; j < text.length; j++) {
    const char = text[j];
    if (char === "\\") j++;
    else if (char === "\n" && text[j + 1] === "\n") return -1;
    else if (char === "$") {
      const fits =
        /\S/.test(text[j - 1] ?? "") && !/\d/.test(text[j + 1] ?? "");
      return fits ? j : -1;
    }
  }
  return -1;
}
