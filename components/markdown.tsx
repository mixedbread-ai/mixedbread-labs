"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { Components } from "streamdown";

// The Markdown renderer loads with the first expanded result or answer
export const Markdown = dynamic(
  () => import("@/components/chat/response").then((m) => m.Response),
  { ssr: false }
);

export function preloadMarkdown() {
  void import("@/components/chat/response");
}

// Streamdown passes each element its syntax node, which the DOM doesn't take
interface Node {
  node?: unknown;
}

function Heading({ node, ...props }: ComponentProps<"h3"> & Node) {
  return (
    <h3
      {...props}
      className="mt-5 mb-1.5 text-[15px] font-medium tracking-tight text-foreground"
    />
  );
}

function Paragraph({ node, ...props }: ComponentProps<"p"> & Node) {
  return <p {...props} className="mb-2 leading-6" />;
}

function OrderedList({ node, ...props }: ComponentProps<"ol"> & Node) {
  return <ol {...props} className="ml-4 list-outside list-decimal" />;
}

function List({ node, ...props }: ComponentProps<"ul"> & Node) {
  return <ul {...props} className="ml-4 list-outside list-disc" />;
}

function Item({ node, ...props }: ComponentProps<"li"> & Node) {
  return <li {...props} className="py-1 leading-6" />;
}

function Link({ node, ...props }: ComponentProps<"a"> & Node) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-foreground underline underline-offset-4"
    />
  );
}

function Table({ node, ...props }: ComponentProps<"table"> & Node) {
  return (
    <div className="my-4 overflow-x-auto">
      <table
        {...props}
        className="w-full border-collapse text-[13.5px] tabular-nums"
      />
    </div>
  );
}

function Head({ node, ...props }: ComponentProps<"thead"> & Node) {
  return <thead {...props} />;
}

function Row({ node, ...props }: ComponentProps<"tr"> & Node) {
  return <tr {...props} className="border-b border-soft" />;
}

function HeaderCell({ node, ...props }: ComponentProps<"th"> & Node) {
  return (
    <th
      {...props}
      className="px-3 py-2 text-left font-medium text-muted-foreground"
    />
  );
}

function Cell({ node, ...props }: ComponentProps<"td"> & Node) {
  return <td {...props} className="px-3 py-2" />;
}

// Code stays plain rather than highlighted, which would load a highlighter
function Code({ node, ...props }: ComponentProps<"code"> & Node) {
  return (
    <code
      {...props}
      className="rounded bg-muted px-1 py-px font-mono text-[0.9em]"
    />
  );
}

/** Quieter than Streamdown's own: text-size headings, tables ruled like Mixedbread Chat's */
export const COMPONENTS: Components = {
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  p: Paragraph,
  ol: OrderedList,
  ul: List,
  li: Item,
  a: Link,
  table: Table,
  thead: Head,
  tr: Row,
  th: HeaderCell,
  td: Cell,
  code: Code,
};
