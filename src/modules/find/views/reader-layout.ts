export const readerRatioKey = "circo-reader-pdf-ratio";

export function clampReaderRatio(value: number) {
  return Math.min(0.75, Math.max(0.25, value));
}
