/** Scrolls an element into view, at once where the visitor asked for less motion */
export function scrollToView(
  element: Element | null | undefined,
  block: ScrollLogicalPosition
) {
  element?.scrollIntoView({
    block,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
