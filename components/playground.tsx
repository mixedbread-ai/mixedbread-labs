"use client";

import { useChat } from "@ai-sdk/react";
import { Tabs } from "@base-ui/react/tabs";
import { DefaultChatTransport } from "ai";
import { cn } from "cn";
import { MessageCircleIcon, SearchIcon, SquarePenIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useRef, useState } from "react";
import { CHAT_SUGGESTIONS, type DocChatMessage } from "@/lib/chat";
import { ChatPanel } from "./chat-panel";
import {
  COLUMN,
  Composer,
  FOCUS,
  SEGMENT,
  SegmentList,
  Suggestions,
} from "./controls";
import { SearchPanel, useSearch } from "./search-panel";

const MODES = [
  {
    value: "search",
    label: "Search",
    Icon: SearchIcon,
    suggestions: [],
  },
  {
    value: "chat",
    label: "Chat",
    Icon: MessageCircleIcon,
    suggestions: CHAT_SUGGESTIONS,
  },
] as const;

type Mode = (typeof MODES)[number]["value"];

// One grid cell holds every layer, so they crossfade in place: switching
// neither moves the composer nor replays a view's entrance
const LAYER =
  "[grid-area:1/1] transition-[opacity,visibility] duration-200 ease-out-quint motion-reduce:transition-none";

// Lowercase: Base UI calls `render` as a plain function, not a component
function keepRendered(props: ComponentProps<"div">) {
  return <div {...props} hidden={false} />;
}

/**
 * Search and chat over a chat's store: the views above, the one composer at
 * the bottom. `intro` shows until the mode in view has something to show;
 * nothing can be asked until `ready`.
 */
export function Playground({
  store,
  ready,
  intro,
}: {
  store: string;
  ready: boolean;
  intro: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("search");
  // Each mode keeps its own text: the query its results are for, the question not yet sent
  const [drafts, setDrafts] = useState<Record<Mode, string>>({
    search: "",
    chat: "",
  });
  const input = useRef<HTMLTextAreaElement>(null);
  const search = useSearch(store);
  const [transport] = useState(
    () =>
      new DefaultChatTransport<DocChatMessage>({
        api: `/api/chats/${store}/chat`,
      })
  );
  const chat = useChat<DocChatMessage>({ transport });
  const answering = chat.status === "submitted" || chat.status === "streaming";
  const chatting = chat.messages.length > 0;
  const idle =
    mode === "search" ? !search.result && search.status === "idle" : !chatting;

  function setDraft(text: string) {
    setDrafts((current) => ({ ...current, [mode]: text }));
  }

  function submit(value: string) {
    const question = value.trim();
    if (!ready) return;
    if (mode === "search") {
      void search.run(question);
    } else if (!answering) {
      void chat.sendMessage({ text: question });
      setDraft("");
    }
  }

  function pick(example: string) {
    if (mode === "search") setDraft(example);
    submit(example);
  }

  let placeholder = "Search the documents";
  if (!ready) placeholder = "Indexing the documents";
  else if (mode === "chat") {
    placeholder = chatting ? "Ask a follow-up" : "Ask about the documents";
  }

  return (
    <Tabs.Root
      value={mode}
      onValueChange={(value) => {
        setMode(value === "chat" ? "chat" : "search");
        // Back to typing, except on touch, where focus opens the keyboard
        if (matchMedia("(pointer: fine)").matches) input.current?.focus();
      }}
      className="flex min-h-0 w-full flex-1 flex-col gap-3 pb-3 md:pb-4"
    >
      {/* One column the width of the screen: an auto column grows to the
          widest unwrapped line inside, such as a truncated step */}
      <div className="grid min-h-0 flex-1 grid-cols-1">
        {MODES.map(({ value }) => (
          <Tabs.Panel
            key={value}
            value={value}
            keepMounted
            render={keepRendered}
            className={cn(
              LAYER,
              "flex min-h-0 flex-col data-hidden:pointer-events-none data-hidden:invisible data-hidden:opacity-0"
            )}
          >
            {value === "search" ? (
              <SearchPanel search={search} />
            ) : (
              <ChatPanel chat={chat} />
            )}
          </Tabs.Panel>
        ))}
        {/* Last, so it sits above the empty view of an idle mode */}
        {idle && (
          <Welcome mode={mode} ready={ready} onPick={pick}>
            {intro}
          </Welcome>
        )}
      </div>

      <div className={COLUMN}>
        <Composer
          inputRef={input}
          value={drafts[mode]}
          onValueChange={setDraft}
          placeholder={placeholder}
          busy={mode === "search" ? search.status === "loading" : answering}
          onSubmit={submit}
          onStop={mode === "chat" ? () => void chat.stop() : undefined}
          actions={
            mode === "chat" &&
            chatting && (
              <button
                type="button"
                onClick={() => {
                  void chat.stop();
                  chat.setMessages([]);
                }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color] duration-150 hover:bg-muted/60 hover:text-foreground motion-safe:animate-swap-in",
                  FOCUS
                )}
              >
                <SquarePenIcon className="size-4" />
                <span className="sr-only">New chat</span>
              </button>
            )
          }
        >
          <SegmentList>
            {MODES.map(({ value, label, Icon }) => (
              <Tabs.Tab key={value} value={value} className={SEGMENT}>
                <Icon className="size-3.5" />
                {label}
              </Tabs.Tab>
            ))}
          </SegmentList>
        </Composer>
      </div>
    </Tabs.Root>
  );
}

/** The chat's intro, until the mode in view has something to show */
function Welcome({
  mode,
  ready,
  onPick,
  children,
}: {
  mode: Mode;
  ready: boolean;
  onPick: (example: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={cn(LAYER, "flex min-h-0 flex-col overflow-y-auto")}>
      <div
        className={cn(
          COLUMN,
          "my-auto flex flex-col items-center gap-5 py-6 text-center"
        )}
      >
        {children}
        {/* Both lists share one cell and crossfade: the block keeps the taller
            one's height, so nothing above it shifts when the mode changes */}
        {ready && (
          <div className="mt-3 grid w-full grid-cols-1">
            {MODES.map(({ value, suggestions }) => (
              <div
                key={value}
                data-shown={value === mode}
                className={cn(
                  LAYER,
                  "data-[shown=false]:invisible data-[shown=false]:opacity-0"
                )}
              >
                <Suggestions items={suggestions} onPick={onPick} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
