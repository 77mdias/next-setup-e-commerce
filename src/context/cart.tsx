"use client";

import { Product } from "@prisma/client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";

export interface CartProcuct
  extends Pick<
    Product,
    | "id"
    | "name"
    | "description"
    | "price"
    | "originalPrice"
    | "images"
    | "specifications"
  > {
  quantity: number;
  storeId?: string | null;
}

export interface ICartContext {
  products: CartProcuct[];
  addProductToCart: (product: CartProcuct) => void;
  decreaseProductQuantity: (productId: string) => void;
  increaseProductQuantity: (productId: string) => void;
  removeProductFromCart: (productId: string) => void;
  total: number;
  totalQuantity: number;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  clearCart: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setProducts: (products: CartProcuct[]) => void;
  migrateFromLocalStorage: () => Promise<void>;
}

export const CartContext = createContext<ICartContext>({
  products: [],
  addProductToCart: () => {},
  decreaseProductQuantity: () => {},
  increaseProductQuantity: () => {},
  removeProductFromCart: () => {},
  total: 0,
  totalQuantity: 0,
  isLoading: false,
  error: null,
  setError: () => {},
  clearCart: () => {},
  loading: false,
  setLoading: () => {},
  setProducts: () => {},
  migrateFromLocalStorage: async () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<CartProcuct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  // Calcular total e quantidade total sempre que os produtos mudarem
  const total = products.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0,
  );
  const totalQuantity = products.reduce(
    (acc, product) => acc + product.quantity,
    0,
  );

  // Carregar carrinho baseado no status de autenticação
  useEffect(() => {
    if (authLoading) return; // Aguarda autenticação carregar

    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          // Usuário logado: carregar do banco
          await loadCartFromDatabase();
        } else {
          // Usuário não logado: carregar do localStorage
          loadCartFromLocalStorage();
        }
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        setError("Erro ao carregar carrinho");
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated, authLoading]);

  // Migrar carrinho quando usuário fizer login
  useEffect(() => {
    if (isAuthenticated && !hasMigrated && !authLoading) {
      migrateFromLocalStorage();
    }
  }, [isAuthenticated, hasMigrated, authLoading]);

  // Carregar carrinho do localStorage (usuário não logado)
  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartProcuct[];
        setProducts(parsedCart);
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
      setError("Erro ao carregar carrinho salvo");
    }
  };

  // Carregar carrinho do banco de dados (usuário logado)
  const loadCartFromDatabase = async () => {
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        // Converter formato do banco para formato do contexto
        const cartProducts: CartProcuct[] = data.cart.map((item: any) => ({
          id: item.product.id,
          storeId: item.product.storeId,
          name: item.product.name,
          description: item.product.description,
          price: item.product.price,
          originalPrice: item.product.originalPrice,
          images: item.product.images,
          specifications: item.product.specifications,
          quantity: item.quantity,
        }));
        setProducts(cartProducts);
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do banco:", error);
      setError("Erro ao carregar carrinho do servidor");
    }
  };

  // Salvar no localStorage (apenas para usuários não logados)
  const saveToLocalStorage = (cartProducts: CartProcuct[]) => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem("cart", JSON.stringify(cartProducts));
      } catch (error) {
        console.error("Erro ao salvar carrinho no localStorage:", error);
        setError("Erro ao salvar carrinho");
      }
    }
  };

  // Migrar carrinho do localStorage para o banco
  const migrateFromLocalStorage = async () => {
    if (hasMigrated || !isAuthenticated) return;

    try {
      setLoading(true);
      const savedCart = localStorage.getItem("cart");

      if (savedCart) {
        const localCartItems = JSON.parse(savedCart) as CartProcuct[];

        if (localCartItems.length > 0) {
          const response = await fetch("/api/cart/migrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartItems: localCartItems }),
          });

          if (response.ok) {
            const data = await response.json();
            // Atualizar com carrinho migrado
            const cartProducts: CartProcuct[] = data.cart.map((item: any) => ({
              id: item.product.id,
              storeId: item.product.storeId,
              name: item.product.name,
              description: item.product.description,
              price: item.product.price,
              originalPrice: item.product.originalPrice,
              images: item.product.images,
              specifications: item.product.specifications,
              quantity: item.quantity,
            }));
            setProducts(cartProducts);

            // Limpar localStorage após migração bem-sucedida
            localStorage.removeItem("cart");
          }
        }
      }

      setHasMigrated(true);
    } catch (error) {
      console.error("Erro na migração do carrinho:", error);
      setError("Erro ao migrar carrinho");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar produto ao carrinho
  const addProductToCart = async (product: CartProcuct) => {
    try {
      setLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Usuário logado: usar API
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            quantity: product.quantity,
          }),
        });

        if (response.ok) {
          // Recarregar carrinho do banco
          await loadCartFromDatabase();
        } else {
          throw new Error("Erro na API do carrinho");
        }
      } else {
        // Usuário não logado: usar localStorage
        const newProducts = [...products];
        const existingProduct = newProducts.find((p) => p.id === product.id);

        if (existingProduct) {
          existingProduct.quantity += product.quantity;
        } else {
          newProducts.push(product);
        }

        setProducts(newProducts);
        saveToLocalStorage(newProducts);
      }
    } catch (error) {
      console.error("Erro ao adicionar produto ao carrinho:", error);
      setError("Erro ao adicionar produto ao carrinho");
    } finally {
      setLoading(false);
    }
  };

  // Diminuir quantidade do produto
  const decreaseProductQuantity = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const currentProduct = products.find((p) => p.id === productId);
      if (!currentProduct) return;

      const newQuantity = currentProduct.quantity - 1;

      if (isAuthenticated) {
        // Usuário logado: usar API
        const response = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity: newQuantity,
          }),
        });

        if (response.ok) {
          await loadCartFromDatabase();
        } else {
          throw new Error("Erro na API do carrinho");
        }
      } else {
        // Usuário não logado: usar localStorage
        const newProducts = products
          .map((product) =>
            product.id === productId && product.quantity > 1
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          )
          .filter((product) => product.quantity > 0);

        setProducts(newProducts);
        saveToLocalStorage(newProducts);
      }
    } catch (error) {
      console.error("Erro ao diminuir quantidade do produto:", error);
      setError("Erro ao diminuir quantidade do produto");
    } finally {
      setLoading(false);
    }
  };

  // Aumentar quantidade do produto
  const increaseProductQuantity = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const currentProduct = products.find((p) => p.id === productId);
      if (!currentProduct) return;

      const newQuantity = currentProduct.quantity + 1;

      if (isAuthenticated) {
        // Usuário logado: usar API
        const response = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity: newQuantity,
          }),
        });

        if (response.ok) {
          await loadCartFromDatabase();
        } else {
          throw new Error("Erro na API do carrinho");
        }
      } else {
        // Usuário não logado: usar localStorage
        const newProducts = products.map((product) =>
          product.id === productId
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        );

        setProducts(newProducts);
        saveToLocalStorage(newProducts);
      }
    } catch (error) {
      console.error("Erro ao aumentar quantidade do produto:", error);
      setError("Erro ao aumentar quantidade do produto");
    } finally {
      setLoading(false);
    }
  };

  // Remover produto do carrinho
  const removeProductFromCart = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Usuário logado: usar API
        const response = await fetch(`/api/cart?productId=${productId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await loadCartFromDatabase();
        } else {
          throw new Error("Erro na API do carrinho");
        }
      } else {
        // Usuário não logado: usar localStorage
        const newProducts = products.filter(
          (product) => product.id !== productId,
        );
        setProducts(newProducts);
        saveToLocalStorage(newProducts);
      }
    } catch (error) {
      console.error("Erro ao remover produto do carrinho:", error);
      setError("Erro ao remover produto do carrinho");
    } finally {
      setLoading(false);
    }
  };

  // Limpar carrinho
  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Usuário logado: usar API
        const response = await fetch("/api/cart", {
          method: "DELETE",
        });

        if (response.ok) {
          setProducts([]);
        } else {
          throw new Error("Erro na API do carrinho");
        }
      } else {
        // Usuário não logado: usar localStorage
        setProducts([]);
        localStorage.removeItem("cart");
      }
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error);
      setError("Erro ao limpar carrinho");
    } finally {
      setLoading(false);
    }
  };

  // Valores do contexto
  const contextValue: ICartContext = {
    products,
    total,
    totalQuantity,
    isLoading,
    error,
    loading,
    addProductToCart,
    decreaseProductQuantity,
    increaseProductQuantity,
    removeProductFromCart,
    clearCart,
    setError,
    setLoading,
    setProducts,
    migrateFromLocalStorage,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

// Hook personalizado para usar o contexto do carrinho
export const useCart = (): ICartContext => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }

  return context;
};
