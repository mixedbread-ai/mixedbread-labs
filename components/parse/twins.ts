/**
 * Each box on a page names its row in the list and its text in `data-twin`,
 * and each of those names the box. Hovering one lights the others with
 * `data-linked`, straight on the DOM, so a pointer sweeping hundreds of
 * elements while scrolling renders nothing.
 */
export function linkTwins(root: HTMLElement | null) {
  if (!root) return;
  let names: string | undefined;
  let lit: Element[] = [];

  const light = (twins: string | undefined) => {
    if (twins === names) return;
    for (const twin of lit) twin.removeAttribute("data-linked");
    names = twins;
    lit = (twins?.split(" ") ?? []).flatMap(
      (id) => document.getElementById(id) ?? []
    );
    for (const twin of lit) twin.setAttribute("data-linked", "");
  };
  const onOver = (event: PointerEvent) => {
    light(
      (event.target as Element).closest<HTMLElement>("[data-twin]")?.dataset
        .twin
    );
  };
  const onLeave = () => light(undefined);

  const listening = new AbortController();
  root.addEventListener("pointerover", onOver, listening);
  root.addEventListener("pointerleave", onLeave, listening);
  return () => {
    listening.abort();
    light(undefined);
  };
}

/** The element a click inside a pane landed on */
export function elementAt(target: EventTarget | null): string | undefined {
  return (target as Element | null)?.closest<HTMLElement>("[data-element]")
    ?.dataset.element;
}
