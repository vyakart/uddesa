export function exportToCanvas() {
  return null;
}

export function exportToBlob() {
  return Promise.resolve(new Blob());
}

export function exportToSvg() {
  return Promise.resolve('<svg></svg>');
}
