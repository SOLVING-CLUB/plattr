import breakfastImg from '@assets/generated_images/delicious_indian_breakfast_spread.png';
import tiffinsImg from '@assets/generated_images/delicious_indian_breakfast_spread.png'; // Reusing for now or use another
import lunchImg from '@assets/generated_images/gourmet_lunch_thali.png';
import snacksImg from '@assets/generated_images/tasty_evening_snacks.png';
import dinnerImg from '@assets/generated_images/dinner_feast.png';

export interface Category {
  id: string;
  name: string;
  mealType: 'breakfast' | 'tiffins' | 'snacks' | 'lunch-dinner';
  imageUrl: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  mealType: ('breakfast' | 'tiffins' | 'snacks' | 'lunch-dinner')[];
  categoryId: string;
  isAvailable: boolean;
  spiceLevel?: 'mild' | 'medium' | 'spicy' | 'extra-spicy';
  dietaryType?: 'veg' | 'non-veg' | 'vegan';
  rating?: number;
  time?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Breakfast',
    mealType: 'breakfast',
    imageUrl: breakfastImg,
  },
  {
    id: '2',
    name: 'Tiffins',
    mealType: 'tiffins',
    imageUrl: tiffinsImg,
  },
  {
    id: '3',
    name: 'Lunch & Dinner',
    mealType: 'lunch-dinner',
    imageUrl: lunchImg,
  },
  {
    id: '4',
    name: 'Snacks',
    mealType: 'snacks',
    imageUrl: snacksImg,
  }
];

export const DISHES: Dish[] = [
  {
    id: '1',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato filling, served with chutney and sambar.',
    price: 120,
    imageUrl: breakfastImg,
    mealType: ['breakfast', 'tiffins'],
    categoryId: '1',
    isAvailable: true,
    spiceLevel: 'medium',
    dietaryType: 'veg',
    rating: 4.8,
    time: '20 min'
  },
  {
    id: '2',
    name: 'Idli Sambar',
    description: 'Steamed rice cakes served with lentil soup and coconut chutney.',
    price: 80,
    imageUrl: tiffinsImg,
    mealType: ['breakfast', 'tiffins'],
    categoryId: '1',
    isAvailable: true,
    spiceLevel: 'mild',
    dietaryType: 'veg',
    rating: 4.5,
    time: '15 min'
  },
  {
    id: '3',
    name: 'Hyderabadi Biryani',
    description: 'Fragrant basmati rice cooked with aromatic spices and tender chicken.',
    price: 350,
    imageUrl: dinnerImg,
    mealType: ['lunch-dinner'],
    categoryId: '3',
    isAvailable: true,
    spiceLevel: 'spicy',
    dietaryType: 'non-veg',
    rating: 4.9,
    time: '45 min'
  },
  {
    id: '4',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese cubes simmered in a rich, creamy tomato gravy.',
    price: 280,
    imageUrl: lunchImg,
    mealType: ['lunch-dinner'],
    categoryId: '3',
    isAvailable: true,
    spiceLevel: 'medium',
    dietaryType: 'veg',
    rating: 4.7,
    time: '30 min'
  },
  {
    id: '5',
    name: 'Samosa Plate',
    description: 'Crispy pastry filled with spiced potatoes and peas, served with tamarind chutney.',
    price: 60,
    imageUrl: snacksImg,
    mealType: ['snacks'],
    categoryId: '4',
    isAvailable: true,
    spiceLevel: 'medium',
    dietaryType: 'veg',
    rating: 4.6,
    time: '10 min'
  }
];
