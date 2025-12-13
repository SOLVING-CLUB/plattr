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
  isSixtyMin?: boolean;
  image?: string;
}

export type BulkMealType = "lunch-dinner" | "tiffins" | "hi-tea" | null;

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
  bulkMealType: BulkMealType;
  cart: CartItem[];
  addedItems: Set<number>;
  mealBoxProgress: MealBoxProgress | null;
  addToCart: (category: ServiceType, item: CartItem, mealType?: BulkMealType) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getQuantity: (itemId: number) => number;
  enterCategory: (category: ServiceType, mealType?: BulkMealType) => void;
  saveMealBoxProgress: (progress: MealBoxProgress) => void;
  clearMealBoxProgress: () => void;
  hasPendingProgress: (category: ServiceType) => boolean;
  setBulkMealType: (mealType: BulkMealType) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "foodDeliveryCart";
const MEALBOX_STORAGE_KEY = "mealBoxProgress";

export function CartProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<ServiceType | null>(null);
  const [bulkMealType, setBulkMealTypeState] = useState<BulkMealType>(null);
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
        setBulkMealTypeState(data.bulkMealType || null);
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
        JSON.stringify({ activeCategory, bulkMealType, cart }),
      );
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [activeCategory, bulkMealType, cart]);

  useEffect(() => {
    if (mealBoxProgress) {
      localStorage.setItem(MEALBOX_STORAGE_KEY, JSON.stringify(mealBoxProgress));
    } else {
      localStorage.removeItem(MEALBOX_STORAGE_KEY);
    }
  }, [mealBoxProgress]);

  const addToCart = (category: ServiceType, item: CartItem, mealType?: BulkMealType) => {
    if (activeCategory && activeCategory !== category) {
      setCart([item]);
      setAddedItems(new Set([item.id]));
      if (category === "bulk-meals" && mealType) {
        setBulkMealTypeState(mealType);
      } else {
        setBulkMealTypeState(null);
      }
    } else {
      // Prevent mixing 60-min and regular items in the same cart
      const hasExistingItems = cart.length > 0;
      const existingIsSixtyMin = cart[0]?.isSixtyMin;
      const newIsSixtyMin = item.isSixtyMin;
      
      // If mixing different order types, clear cart and start fresh
      if (hasExistingItems && existingIsSixtyMin !== newIsSixtyMin) {
        setCart([item]);
        setAddedItems(new Set([item.id]));
        setActiveCategory(category);
        if (category === "bulk-meals" && mealType) {
          setBulkMealTypeState(mealType);
        }
        return;
      }

      // For bulk-meals, if meal type is different, clear cart and start fresh
      if (category === "bulk-meals" && mealType && bulkMealType && mealType !== bulkMealType) {
        setCart([item]);
        setAddedItems(new Set([item.id]));
        setActiveCategory(category);
        setBulkMealTypeState(mealType);
        return;
      }
      
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

      // Set bulkMealType if adding to bulk-meals
      if (category === "bulk-meals" && mealType && !bulkMealType) {
        setBulkMealTypeState(mealType);
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
    setBulkMealTypeState(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const setBulkMealType = (mealType: BulkMealType) => {
    // If changing to a different bulk meal type and cart has items, clear it
    if (bulkMealType && mealType && mealType !== bulkMealType && cart.length > 0 && activeCategory === "bulk-meals") {
      setCart([]);
      setAddedItems(new Set());
    }
    setBulkMealTypeState(mealType);
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

  const enterCategory = (category: ServiceType, mealType?: BulkMealType) => {
    if (activeCategory && activeCategory !== category) {
      if (activeCategory === "bulk-meals") {
        setCart([]);
        setAddedItems(new Set());
        setBulkMealTypeState(null);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      if (activeCategory === "mealbox") {
        clearMealBoxProgress();
      }
      setActiveCategory(category);
      if (category === "bulk-meals" && mealType) {
        setBulkMealTypeState(mealType);
      }
    } else if (!activeCategory) {
      setActiveCategory(category);
      if (category === "bulk-meals" && mealType) {
        setBulkMealTypeState(mealType);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        activeCategory,
        bulkMealType,
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
        setBulkMealType,
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

