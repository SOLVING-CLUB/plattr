import CategoryCard from '../CategoryCard';
import categoryImage from '@assets/stock_images/indian_food_platter__04e21eaf.jpg';

export default function CategoryCardExample() {
  return (
    <div className="p-4 grid grid-cols-2 gap-3 max-w-2xl">
      <CategoryCard 
        name="South Indian"
        dishCount={15}
        image={categoryImage}
        onClick={() => console.log('South Indian clicked')}
      />
      <CategoryCard 
        name="North Indian"
        dishCount={12}
        image={categoryImage}
        onClick={() => console.log('North Indian clicked')}
      />
    </div>
  );
}
