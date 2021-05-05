import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    console.log(productId)
    try {
      const productExist = cart.find((product) => product.id === productId )
      if(!productExist){
        const response = await api.get(`/products/${productId}`)
        setCart([...cart, {...response.data, amount: 1}])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...response.data, amount: 1}]))
      }else {
        const response = await api.get(`/stock/${productId}`)
        if(productExist.amount + 1 <= response.data.amount){
          const aux = cart.map((product, index) => {
            if(product.id === productExist.id) {
                return {
                  ...product,
                  amount: product.amount + 1
                }
            }
            return product
          });
          setCart(aux);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(aux))
        }else {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }
        
      }
      
      
    } catch{
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(product => product.id === productId)
      if(!productExist){
        throw new Error()
      }
      const aux = cart.filter(product => product.id !== productId)
      setCart(aux);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(aux))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productExist = cart.find(product => product.id === productId)
      if(!productExist){
        throw new Error()
      }
      const response = await api.get(`/stock/${productId}`)

      if(amount <= response.data.amount && amount > 0){
        const aux = cart.map((product) => {
          if(product.id === productId) {
              return {
                ...product,
                amount: amount
              }
          }
          return product
        });
        setCart(aux);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(aux))
      }else {
        toast.error('Quantidade solicitada fora de estoque');
        return 
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
