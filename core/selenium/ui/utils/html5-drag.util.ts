import { WebDriver, WebElement } from "selenium-webdriver";

/**
 * The events a browser emits for an HTML5 drag, sharing one DataTransfer. They are spaced across
 * tasks of the event loop because a drag library discards a `dragover` that arrives before it has
 * finished starting the drag.
 */
const SIMULATE_HTML5_DRAG = `
const [source, target, done] = arguments;
const rect = target.getBoundingClientRect();
const clientX = rect.left + rect.width / 2;
const clientY = rect.top + rect.height / 2;
const dataTransfer = new DataTransfer();
const base = { bubbles: true, cancelable: true, composed: true, clientX, clientY, button: 0, buttons: 1 };
const pointer = (type, element) =>
  element.dispatchEvent(new PointerEvent(type, { ...base, pointerId: 1, isPrimary: true }));
const mouse = (type, element) => element.dispatchEvent(new MouseEvent(type, base));
const drag = (type, element) => element.dispatchEvent(new DragEvent(type, { ...base, dataTransfer }));
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

(async () => {
  pointer("pointerdown", source);
  mouse("mousedown", source);
  await settle();
  drag("dragstart", source);
  await settle();
  drag("dragenter", target);
  await settle();
  drag("dragover", target);
  await settle();
  drag("dragover", target);
  await settle();
  drag("drop", target);
  await settle();
  drag("dragend", source);
  await settle();
  done();
})();
`;

export async function simulateHtml5Drag(
  driver: WebDriver,
  source: WebElement,
  target: WebElement,
): Promise<void> {
  await driver.executeAsyncScript(SIMULATE_HTML5_DRAG, source, target);
}
