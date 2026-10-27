import { useEffect, useState } from 'react';
import { catalogApi } from '../api.js';
import { getApiErrorMessage } from '../utils/catalog.js';

export default function useProductDetails(idOrSlug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setProduct(null);
    catalogApi
      .getProduct(idOrSlug)
      .then(({ product: value }) => {
        if (active) setProduct(value);
      })
      .catch((requestError) => {
        if (active)
          setError(
            getApiErrorMessage(
              requestError,
              'Product details could not be loaded.',
              'This product is no longer available.',
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [idOrSlug]);

  return { product, loading, error };
}
