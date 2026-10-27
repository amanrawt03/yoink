import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api.js';
import {
  getApiErrorMessage,
  PRODUCT_PAGE_SIZE,
  updateCatalogSearchParams,
} from '../utils/catalog.js';

export default function useProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ products: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const order = searchParams.get('order') || 'desc';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    let active = true;
    catalogApi
      .listCategories()
      .then(({ categories: values }) => {
        if (active) setCategories(values);
      })
      .catch((error) => {
        if (active) setError(getApiErrorMessage(error, 'Categories could not be loaded.'));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    catalogApi
      .listProducts({
        search: searchParams.get('search') || undefined,
        category: category || undefined,
        sortBy,
        order,
        page,
        limit: PRODUCT_PAGE_SIZE,
      })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((error) => {
        if (active)
          setError(getApiErrorMessage(error, 'Products could not be loaded. Please try again.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [searchParams, category, sortBy, order, page]);

  function changeParams(updates) {
    setSearchParams(updateCatalogSearchParams(searchParams, updates));
  }

  function submitSearch(event) {
    event.preventDefault();
    changeParams({ search: search.trim() });
  }

  return {
    search,
    setSearch,
    categories,
    result,
    loading,
    error,
    category,
    sortBy,
    order,
    page,
    changeParams,
    submitSearch,
  };
}
