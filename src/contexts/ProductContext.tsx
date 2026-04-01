import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ProductType = 'office' | 'society';

interface ProductContextType {
  product: ProductType | null;
  setProduct: (product: ProductType) => void;
  clearProduct: () => void;
  productLabel: string;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const PRODUCT_KEY = 'visitorhub_product';

export function ProductProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<ProductType | null>(() => {
    const stored = localStorage.getItem(PRODUCT_KEY);
    return (stored === 'office' || stored === 'society') ? stored : null;
  });

  const setProduct = (p: ProductType) => {
    localStorage.setItem(PRODUCT_KEY, p);
    setProductState(p);
  };

  const clearProduct = () => {
    localStorage.removeItem(PRODUCT_KEY);
    setProductState(null);
  };

  const productLabel = product === 'office' ? 'Office' : product === 'society' ? 'Housing Society' : '';

  return (
    <ProductContext.Provider value={{ product, setProduct, clearProduct, productLabel }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProduct must be used within ProductProvider');
  return context;
}
