import { db } from "./db";
import { categories, dishes } from "@shared/schema";

const CATEGORIES_DATA = [
  // Tiffins
  { id: 'south-indian-tiffins', name: 'South Indian Tiffins', mealType: 'tiffins', displayOrder: 1, imageUrl: '/images/idli.jpg' },
  { id: 'north-indian-tiffins', name: 'North Indian Tiffins', mealType: 'tiffins', displayOrder: 2, imageUrl: '/images/paratha.jpg' },
  { id: 'quick-bites', name: 'Quick Bites', mealType: 'tiffins', displayOrder: 3, imageUrl: '/images/upma.jpg' },
  
  // Snacks
  { id: 'fried-snacks', name: 'Fried Snacks', mealType: 'snacks', displayOrder: 1, imageUrl: '/images/samosa.jpg' },
  { id: 'baked-snacks', name: 'Baked Snacks', mealType: 'snacks', displayOrder: 2, imageUrl: '/images/puff.jpg' },
  { id: 'chaats', name: 'Chaats', mealType: 'snacks', displayOrder: 3, imageUrl: '/images/pani-puri.jpg' },
  
  // Lunch/Dinner
  { id: 'rice-items', name: 'Rice Items', mealType: 'lunch-dinner', displayOrder: 1, imageUrl: '/images/fried-rice.jpg' },
  { id: 'breads-curries', name: 'Breads & Curries', mealType: 'lunch-dinner', displayOrder: 2, imageUrl: '/images/naan.jpg' },
  { id: 'biryani', name: 'Biryani', mealType: 'lunch-dinner', displayOrder: 3, imageUrl: '/images/biryani.jpg' },
];

const DISHES_DATA = [
  // South Indian Tiffins - Vegetarian - Basic Plan
  { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', price: '80', imageUrl: '/images/dosa.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'medium', dietaryType: 'veg', planType: 'basic' },
  { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil stew', price: '60', imageUrl: '/images/idli.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'veg', planType: 'basic' },
  { name: 'Medu Vada', description: 'Crispy lentil fritters', price: '40', imageUrl: '/images/vada.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'veg', planType: 'basic' },
  
  // South Indian Tiffins - Vegetarian - Gold Plan
  { name: 'Pongal', description: 'Rice and lentil khichdi with ghee', price: '70', imageUrl: '/images/pongal.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'veg', planType: 'gold' },
  { name: 'Onion Uttapam', description: 'Thick rice pancake with onion toppings', price: '90', imageUrl: '/images/uttapam.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'veg', planType: 'gold' },
  { name: 'Rava Dosa', description: 'Crispy semolina crepe', price: '85', imageUrl: '/images/rava-dosa.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'veg', planType: 'gold' },
  
  // South Indian Tiffins - Non-Vegetarian - Gold Plan
  { name: 'Egg Dosa', description: 'Crispy dosa with egg topping', price: '55', imageUrl: '/images/egg-dosa.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'non-veg', planType: 'gold' },
  { name: 'Egg Appam', description: 'Soft rice pancake with egg', price: '65', imageUrl: '/images/egg-appam.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'mild', dietaryType: 'non-veg', planType: 'gold' },
  
  // South Indian Tiffins - Premium Curries - Platinum Plan
  { name: 'Chicken Curry', description: 'Spicy South Indian chicken curry', price: '95', imageUrl: '/images/chicken-curry.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Natukodi Curry', description: 'Traditional country chicken curry', price: '155', imageUrl: '/images/natukodi-curry.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Mutton Curry', description: 'Rich and flavorful mutton curry', price: '195', imageUrl: '/images/mutton-curry.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  
  // South Indian Tiffins - Combo with Chicken - Platinum Plan
  { name: 'Idly with Chicken', description: 'Steamed rice cakes with chicken curry', price: '139', imageUrl: '/images/idli.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'medium', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Vada with Chicken', description: 'Crispy lentil fritters with chicken curry', price: '145', imageUrl: '/images/vada.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'medium', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Dosa with Chicken', description: 'Crispy dosa with chicken curry', price: '145', imageUrl: '/images/dosa.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'medium', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Appam with Chicken', description: 'Soft rice pancake with chicken curry', price: '135', imageUrl: '/images/appam.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'medium', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Puri with Chicken', description: 'Fried bread with chicken curry', price: '145', imageUrl: '/images/puri.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'medium', dietaryType: 'non-veg', planType: 'platinum' },
  
  // South Indian Tiffins - Combo with Natukodi - Platinum Plan
  { name: 'Idly with Natukodi', description: 'Steamed rice cakes with country chicken curry', price: '195', imageUrl: '/images/idli.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Vada with Natukodi', description: 'Crispy lentil fritters with country chicken curry', price: '209', imageUrl: '/images/vada.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Dosa with Natukodi', description: 'Crispy dosa with country chicken curry', price: '209', imageUrl: '/images/dosa.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Appam with Natukodi', description: 'Soft rice pancake with country chicken curry', price: '195', imageUrl: '/images/appam.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Puri with Natukodi', description: 'Fried bread with country chicken curry', price: '205', imageUrl: '/images/puri.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  
  // South Indian Tiffins - Combo with Mutton - Platinum Plan
  { name: 'Idly with Mutton', description: 'Steamed rice cakes with mutton curry', price: '235', imageUrl: '/images/idli.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Vada with Mutton', description: 'Crispy lentil fritters with mutton curry', price: '245', imageUrl: '/images/vada.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Dosa with Mutton', description: 'Crispy dosa with mutton curry', price: '255', imageUrl: '/images/dosa.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Appam with Mutton', description: 'Soft rice pancake with mutton curry', price: '235', imageUrl: '/images/appam.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  { name: 'Puri with Mutton', description: 'Fried bread with mutton curry', price: '245', imageUrl: '/images/puri.jpg', mealType: 'tiffins', categoryId: 'south-indian-tiffins', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  
  // North Indian Tiffins - Basic Plan
  { name: 'Aloo Paratha', description: 'Stuffed flatbread with spiced potato', price: '70', imageUrl: '/images/paratha.jpg', mealType: 'tiffins', categoryId: 'north-indian-tiffins', spiceLevel: 'medium', dietaryType: 'veg', planType: 'basic' },
  { name: 'Poha', description: 'Flattened rice with spices and peanuts', price: '50', imageUrl: '/images/poha.jpg', mealType: 'tiffins', categoryId: 'north-indian-tiffins', spiceLevel: 'mild', dietaryType: 'veg', planType: 'basic' },
  
  // North Indian Tiffins - Gold Plan
  { name: 'Chole Bhature', description: 'Chickpea curry with fried bread', price: '100', imageUrl: '/images/chole.jpg', mealType: 'tiffins', categoryId: 'north-indian-tiffins', spiceLevel: 'medium', dietaryType: 'veg', planType: 'gold' },
  
  // Quick Bites - Basic Plan
  { name: 'Upma', description: 'Semolina porridge with vegetables', price: '45', imageUrl: '/images/upma.jpg', mealType: 'tiffins', categoryId: 'quick-bites', spiceLevel: 'mild', dietaryType: 'veg', planType: 'basic' },
  { name: 'Bread Toast', description: 'Toasted bread with butter', price: '30', imageUrl: '/images/toast.jpg', mealType: 'tiffins', categoryId: 'quick-bites', spiceLevel: 'mild', dietaryType: 'veg', planType: 'basic' },
  
  // Fried Snacks - Basic Plan
  { name: 'Samosa', description: 'Crispy pastry with spiced filling', price: '25', imageUrl: '/images/samosa.jpg', mealType: 'snacks', categoryId: 'fried-snacks', spiceLevel: 'medium', dietaryType: 'veg', planType: 'basic' },
  { name: 'Pakora', description: 'Mixed vegetable fritters', price: '35', imageUrl: '/images/pakora.jpg', mealType: 'snacks', categoryId: 'fried-snacks', spiceLevel: 'medium', dietaryType: 'veg', planType: 'basic' },
  
  // Fried Snacks - Gold Plan
  { name: 'Spring Roll', description: 'Crispy vegetable rolls', price: '40', imageUrl: '/images/spring-roll.jpg', mealType: 'snacks', categoryId: 'fried-snacks', spiceLevel: 'mild', dietaryType: 'veg', planType: 'gold' },
  
  // Baked Snacks - Gold Plan
  { name: 'Veg Puff', description: 'Flaky pastry with vegetable filling', price: '30', imageUrl: '/images/puff.jpg', mealType: 'snacks', categoryId: 'baked-snacks', spiceLevel: 'mild', dietaryType: 'veg', planType: 'gold' },
  { name: 'Cheese Croissant', description: 'Buttery pastry with cheese', price: '45', imageUrl: '/images/croissant.jpg', mealType: 'snacks', categoryId: 'baked-snacks', spiceLevel: 'mild', dietaryType: 'veg', planType: 'gold' },
  
  // Chaats - Platinum Plan
  { name: 'Pani Puri', description: 'Crispy shells with tangy water', price: '35', imageUrl: '/images/pani-puri.jpg', mealType: 'snacks', categoryId: 'chaats', spiceLevel: 'spicy', dietaryType: 'veg', planType: 'platinum' },
  { name: 'Bhel Puri', description: 'Puffed rice with chutneys', price: '40', imageUrl: '/images/bhel.jpg', mealType: 'snacks', categoryId: 'chaats', spiceLevel: 'medium', dietaryType: 'veg', planType: 'platinum' },
  { name: 'Dahi Puri', description: 'Crispy shells with yogurt and chutneys', price: '45', imageUrl: '/images/dahi-puri.jpg', mealType: 'snacks', categoryId: 'chaats', spiceLevel: 'mild', dietaryType: 'veg', planType: 'platinum' },
  
  // Rice Items - Basic Plan
  { name: 'Lemon Rice', description: 'Tangy rice with peanuts', price: '80', imageUrl: '/images/lemon-rice.jpg', mealType: 'lunch-dinner', categoryId: 'rice-items', spiceLevel: 'mild', dietaryType: 'veg', planType: 'basic' },
  
  // Rice Items - Gold Plan
  { name: 'Veg Fried Rice', description: 'Stir-fried rice with vegetables', price: '120', imageUrl: '/images/fried-rice.jpg', mealType: 'lunch-dinner', categoryId: 'rice-items', spiceLevel: 'medium', dietaryType: 'veg', planType: 'gold' },
  
  // Biryani - Gold Plan
  { name: 'Veg Biryani', description: 'Aromatic rice with mixed vegetables', price: '140', imageUrl: '/images/veg-biryani.jpg', mealType: 'lunch-dinner', categoryId: 'biryani', spiceLevel: 'medium', dietaryType: 'veg', planType: 'gold' },
  
  // Biryani - Platinum Plan
  { name: 'Hyderabadi Biryani', description: 'Fragrant rice with spiced meat', price: '180', imageUrl: '/images/biryani.jpg', mealType: 'lunch-dinner', categoryId: 'biryani', spiceLevel: 'spicy', dietaryType: 'non-veg', planType: 'platinum' },
  
  // Breads & Curries - Basic Plan
  { name: 'Roti with Dal Tadka', description: 'Wheat bread with tempered lentils', price: '130', imageUrl: '/images/roti.jpg', mealType: 'lunch-dinner', categoryId: 'breads-curries', spiceLevel: 'medium', dietaryType: 'veg', planType: 'basic' },
  
  // Breads & Curries - Platinum Plan
  { name: 'Naan with Paneer Butter Masala', description: 'Indian bread with creamy paneer curry', price: '160', imageUrl: '/images/naan.jpg', mealType: 'lunch-dinner', categoryId: 'breads-curries', spiceLevel: 'medium', dietaryType: 'veg', planType: 'platinum' },
];

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    // Insert categories
    console.log('Inserting categories...');
    await db.insert(categories).values(CATEGORIES_DATA).onConflictDoNothing();
    
    // Insert dishes
    console.log('Inserting dishes...');
    await db.insert(dishes).values(DISHES_DATA).onConflictDoNothing();
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed();
