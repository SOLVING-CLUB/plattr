import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface StoredPortionSelection {
  slot: number;
  itemId: string | null;
  item?: {
    id: string;
    name: string;
    price: number;
    rating: number;
    reviewCount: number;
    category: string;
    type: string;
    image: string;
  };
}

export interface MealBoxProgress {
  currentStep: number;
  selectedPortions: 3 | 5 | 6 | 8;
  mealPreference: "veg" | "egg" | "non-veg";
  selectedMealType: string;
  vegBoxes: string;
  eggBoxes: string;
  nonVegBoxes: string;
  vegPlateSelections: StoredPortionSelection[];
  eggPlateSelections: StoredPortionSelection[];
  nonVegPlateSelections: StoredPortionSelection[];
  selectedAddons: string[];
  currentDietaryTab: "veg" | "egg" | "non-veg";
}

interface CartContextType {
  activeCategory: ServiceType | null;
  cart: CartItem[];
  addedItems: Set<number>;
  mealBoxProgress: MealBoxProgress | null;
  addToCart: (category: ServiceType, item: CartItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getQuantity: (itemId: number) => number;
  enterCategory: (category: ServiceType) => void;
  saveMealBoxProgress: (progress: MealBoxProgress) => void;
  clearMealBoxProgress: () => void;
  hasPendingProgress: (category: ServiceType) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "foodDeliveryCart";
const MEALBOX_STORAGE_KEY = "mealBoxProgress";

export function CartProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<ServiceType | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [mealBoxProgress, setMealBoxProgress] = useState<MealBoxProgress | null>(
    null,
  );

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const data = JSON.parse(storedCart);
        setActiveCategory(data.activeCategory);
        setCart(data.cart || []);
        setAddedItems(new Set(data.cart?.map((item: CartItem) => item.id) || []));
      } catch (e) {
        console.error("Failed to parse cart data:", e);
      }
    }

    const storedMealBox = localStorage.getItem(MEALBOX_STORAGE_KEY);
    if (storedMealBox) {
      try {
        const data = JSON.parse(storedMealBox);
        setMealBoxProgress(data);
      } catch (e) {
        console.error("Failed to parse MealBox progress:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (activeCategory || cart.length > 0) {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ activeCategory, cart }),
      );
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [activeCategory, cart]);

  useEffect(() => {
    if (mealBoxProgress) {
      localStorage.setItem(MEALBOX_STORAGE_KEY, JSON.stringify(mealBoxProgress));
    } else {
      localStorage.removeItem(MEALBOX_STORAGE_KEY);
    }
  }, [mealBoxProgress]);

  const addToCart = (category: ServiceType, item: CartItem) => {
    if (activeCategory && activeCategory !== category) {
      setCart([item]);
      setAddedItems(new Set([item.id]));
    } else {
      const existing = cart.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        setCart(
          cart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem,
          ),
        );
      } else {
        setCart([...cart, item]);
        setAddedItems(new Set([...Array.from(addedItems), item.id]));
      }
    }
    setActiveCategory(category);
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((item) => item.id !== itemId));
    setAddedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });

    if (cart.filter((item) => item.id !== itemId).length === 0) {
      setActiveCategory(null);
    }
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    setCart(
      cart.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
    );
  };

  const clearCart = () => {
    setCart([]);
    setAddedItems(new Set());
    setActiveCategory(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getQuantity = (itemId: number): number => {
    const item = cart.find((cartItem) => cartItem.id === itemId);
    return item?.quantity || 0;
  };

  const saveMealBoxProgress = (progress: MealBoxProgress) => {
    setMealBoxProgress(progress);
    setActiveCategory("mealbox");
  };

  const clearMealBoxProgress = () => {
    setMealBoxProgress(null);
  };

  const hasPendingProgress = (category: ServiceType): boolean => {
    if (category === "bulk-meals") {
      return cart.length > 0 && activeCategory === "bulk-meals";
    }
    if (category === "mealbox") {
      return mealBoxProgress !== null && mealBoxProgress.currentStep > 1;
    }
    return false;
  };

  const enterCategory = (category: ServiceType) => {
    if (activeCategory && activeCategory !== category) {
      if (activeCategory === "bulk-meals") {
        setCart([]);
        setAddedItems(new Set());
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      if (activeCategory === "mealbox") {
        clearMealBoxProgress();
      }
      setActiveCategory(category);
    } else if (!activeCategory) {
      setActiveCategory(category);
    }
  };

  return (
    <CartContext.Provider
      value={{
        activeCategory,
        cart,
        addedItems,
        mealBoxProgress,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getQuantity,
        enterCategory,
        saveMealBoxProgress,
        clearMealBoxProgress,
        hasPendingProgress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

