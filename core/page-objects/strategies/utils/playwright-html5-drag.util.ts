import { Locator } from "@playwright/test";

/**
 * The events a browser emits for an HTML5 drag, sharing one DataTransfer. They are spaced across
 * tasks of the event loop because a drag library discards a `dragover` that arrives before it has
 * finished starting the drag. Firefox's Playwright automation moves the pointer like Chromium's
 * does, but never synthesizes the native `dragstart`/`dragover`/`drop` sequence Gitea's Kanban board
 * listens for, so neither `Locator.dragTo()` nor a manual mouse path ever reaches the server there.
 */
export async function simulateHtml5Drag(source: Locator, target: Locator): Promise<void> {
  const [sourceHandle, targetHandle] = await Promise.all([
    source.elementHandle(),
    target.elementHandle(),
  ]);

  await source.page().evaluate(
    async ([sourceEl, targetEl]) => {
      const rect = targetEl.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      const dataTransfer = new DataTransfer();
      const base = {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        button: 0,
        buttons: 1,
      };
      const pointer = (type: string, element: Element) =>
        element.dispatchEvent(new PointerEvent(type, { ...base, pointerId: 1, isPrimary: true }));
      const mouse = (type: string, element: Element) =>
        element.dispatchEvent(new MouseEvent(type, base));
      const drag = (type: string, element: Element) =>
        element.dispatchEvent(new DragEvent(type, { ...base, dataTransfer }));
      const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

      pointer("pointerdown", sourceEl);
      mouse("mousedown", sourceEl);
      await settle();
      drag("dragstart", sourceEl);
      await settle();
      drag("dragenter", targetEl);
      await settle();
      drag("dragover", targetEl);
      await settle();
      drag("dragover", targetEl);
      await settle();
      drag("drop", targetEl);
      await settle();
      drag("dragend", sourceEl);
      await settle();
    },
    [sourceHandle, targetHandle],
  );

  await Promise.all([sourceHandle.dispose(), targetHandle.dispose()]);
}
