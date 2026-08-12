export interface PointCapture {
  type: "text" | "image";
  content: string;
  image?: Blob;
  page: number;
  location: { x: number; y: number; width: number; height: number };
}

export async function writePointCaptureToClipboard(
  capture: PointCapture,
): Promise<boolean> {
  try {
    if (capture.type === "text") {
      await navigator.clipboard.writeText(capture.content);
      return true;
    }
    if (!capture.image) return false;
    const item = new ClipboardItem({ [capture.image.type]: capture.image });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    // Clipboard permissions vary by browser; the local capture remains usable.
    return false;
  }
}

export async function readPointCaptureFromClipboard(
  fallback: PointCapture,
): Promise<PointCapture> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (imageType) {
        return {
          ...fallback,
          type: "image",
          content: "",
          image: await item.getType(imageType),
        };
      }
    }
    for (const item of items) {
      if (!item.types.includes("text/plain")) continue;
      const content = await (await item.getType("text/plain")).text();
      if (content.trim()) {
        return { ...fallback, type: "text", content, image: undefined };
      }
    }
  } catch {
    // Fall back when the browser blocks clipboard reads.
  }
  return fallback;
}
