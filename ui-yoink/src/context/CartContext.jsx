import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], subtotal: 0, total: 0 });
      setError('');
      return;
    }
    setLoading(true);
    try {
      setCart(await cartApi.getCart());
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    if (!authLoading) refreshCart();
  }, [authLoading, refreshCart]);
  const mutate = async (action) => {
    const next = await action();
    setCart(next);
    setError('');
    return next;
  };
  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      refreshCart,
      addItem: (id, quantity) => mutate(() => cartApi.addItem(id, quantity)),
      updateItem: (id, quantity) => mutate(() => cartApi.updateItem(id, quantity)),
      removeItem: (id) => mutate(() => cartApi.removeItem(id)),
    }),
    [cart, loading, error, refreshCart],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
