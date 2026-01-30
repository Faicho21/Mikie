/**
 * Etiqueta para mostrar producto: "Nombre · Marca" o solo "Nombre"
 * @param {{ nombre?: string, marca?: string | null }} producto
 * @returns {string}
 */
export function getProductLabel(producto) {
  if (!producto) return '';
  const nombre = producto.nombre || '';
  const marca = producto.marca?.trim?.();
  return marca ? `${nombre} · ${marca}` : nombre;
}
