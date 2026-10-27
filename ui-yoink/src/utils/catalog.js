export const PRODUCT_PAGE_SIZE = 12;

export function formatCurrency(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export function getApiErrorMessage(error, fallback, notFoundMessage) {
  if (notFoundMessage && error.response?.status === 404) return notFoundMessage;
  return error.response?.data?.message || fallback;
}

export function updateCatalogSearchParams(searchParams, updates) {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) =>
    value ? next.set(key, value) : next.delete(key),
  );
  if (!Object.hasOwn(updates, 'page')) next.delete('page');
  return next;
}
