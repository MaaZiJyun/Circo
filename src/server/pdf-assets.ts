export function pdfAssetUrl(directory: string, image: string) {
  return `/api/markdown-assets/${encodeURIComponent(directory)}/${encodeURIComponent(image)}`;
}
