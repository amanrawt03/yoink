import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../api.js';
import { getApiErrorMessage } from '../utils/catalog.js';

export default function useProductDetails(idOrSlug) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const { product: value } = await catalogApi.getProduct(idOrSlug);
      setProduct(value);
    } catch (requestError) {
      setNotFound(requestError.response?.status === 404);
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
    setProduct(null);
    setLoading(true);
    setError('');
    setNotFound(false);
    catalogApi
      .getProduct(idOrSlug)
      .then(({ product: value }) => {
        if (active) setProduct(value);
      })
      .catch((requestError) => {
        if (active) {
          setNotFound(requestError.response?.status === 404);
          setError(
            getApiErrorMessage(
              requestError,
              'Product details could not be loaded.',
              'This product is no longer available.',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [idOrSlug]);

  return { product, loading, error, notFound, refresh };
}
