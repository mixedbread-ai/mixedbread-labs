/**
 * Each box on a page and its row in the list name each other in `data-twin`.
 * Hovering one lights the other with `data-linked`, straight on the DOM, so a
 * pointer sweeping hundreds of elements while scrolling renders nothing.
 */
export function linkTwins(root: HTMLElement | null) {
  if (!root) return;
  let lit: Element | null = null;

  const light = (twin: Element | null) => {
    if (twin === lit) return;
    lit?.removeAttribute("data-linked");
    twin?.setAttribute("data-linked", "");
    lit = twin;
  };
  const onOver = (event: PointerEvent) => {
    const id = (event.target as Element).closest<HTMLElement>("[data-twin]")
      ?.dataset.twin;
    light(id ? document.getElementById(id) : null);
  };
  const onLeave = () => light(null);

  const listening = new AbortController();
  root.addEventListener("pointerover", onOver, listening);
  root.addEventListener("pointerleave", onLeave, listening);
  return () => {
    listening.abort();
    light(null);
  };
}

/** The element a click inside a pane landed on */
export function elementAt(target: EventTarget | null): string | undefined {
  return (target as Element | null)?.closest<HTMLElement>("[data-element]")
    ?.dataset.element;
}
