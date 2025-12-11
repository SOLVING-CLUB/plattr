// localStorage utility for guest cart management
import type { Dish } from "@shared/schema";

export interface LocalCartItem {
  dishId: string;
  quantity: number;
  dish: Dish;
}

const CART_KEY = 'guest_cart';

export const cartStorage = {
  getCart(): LocalCartItem[] {
    try {
      const cart = localStorage.getItem(CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  },

  addItem(dishId: string, quantity: number, dish: Dish): void {
    const cart = this.getCart();
    const existing = cart.find(item => item.dishId === dishId);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ dishId, quantity, dish });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  },

  updateItem(dishId: string, quantity: number): void {
    const cart = this.getCart();
    const item = cart.find(i => i.dishId === dishId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeItem(dishId);
      } else {
        item.quantity = quantity;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      }
    }
  },

  removeItem(dishId: string): void {
    const cart = this.getCart().filter(item => item.dishId !== dishId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  },

  clearCart(): void {
    localStorage.removeItem(CART_KEY);
  },

  getItemCount(): number {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotal(): number {
    return this.getCart().reduce((sum, item) => {
      return sum + (parseFloat(item.dish.price as string) * item.quantity);
    }, 0);
  }
};
