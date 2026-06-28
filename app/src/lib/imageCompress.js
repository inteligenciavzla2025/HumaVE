// Comprime una imagen a JPG por debajo de maxBytes, redimensionando primero
// y reduciendo calidad si todavia no entra. Sin dependencias externas.
export async function comprimirImagen(file, { maxBytes = 200 * 1024, maxDim = 1280 } = {}) {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)

  let quality = 0.8
  let blob = await toBlob(canvas, quality)
  while (blob.size > maxBytes && quality > 0.2) {
    quality -= 0.1
    blob = await toBlob(canvas, quality)
  }
  return blob
}

function toBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}
