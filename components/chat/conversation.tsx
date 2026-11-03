"use client";

import type { UIMessage } from "ai";
import { cn } from "cn";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

type ConversationProps = ComponentProps<typeof StickToBottom> & {
  children: React.ReactNode;
  messages: UIMessage[];
  isStreaming: boolean;
};

export const Conversation = ({
  children,
  messages,
  isStreaming,
  ...props
}: ConversationProps) => {
  return (
    <StickToBottom initial="instant" resize="smooth" stiffness={0.1} {...props}>
      {children}
    </StickToBottom>
  );
};

type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content className={cn("p-4", className)} {...props} />
);

export const ConversationScrollButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    <button
      type="button"
      onClick={() => scrollToBottom()}
      className={cn(
        "absolute bottom-4 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full bg-card shadow-float ring-1 ring-soft transition-[background-color,opacity,translate] duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isAtBottom
          ? "pointer-events-none translate-y-2 opacity-0"
          : "translate-y-0 opacity-100"
      )}
    >
      <span className="sr-only">Scroll to bottom</span>
      <ArrowDownIcon className="size-4" />
    </button>
  );
};
