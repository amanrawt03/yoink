import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../api.js';
import { getApiErrorMessage } from '../utils/catalog.js';

export default function useProductDetails(idOrSlug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { product: value } = await catalogApi.getProduct(idOrSlug);
      setProduct(value);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Product details could not be loaded.',
          'This product is no longer available.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    let active = true;
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

  return { product, loading, error, refresh };
}
