import MealTypeCard from '../MealTypeCard';
import { Coffee } from 'lucide-react';

export default function MealTypeCardExample() {
  return (
    <div className="p-4 max-w-md">
      <MealTypeCard 
        title="Tiffins"
        icon={Coffee}
        itemCount={24}
        onClick={() => console.log('Tiffins clicked')}
      />
    </div>
  );
}
