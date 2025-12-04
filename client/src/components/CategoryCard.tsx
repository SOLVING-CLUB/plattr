import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  name: string;
  dishCount: number;
  image: string;
  onClick: () => void;
}

export default function CategoryCard({ name, dishCount, image, onClick }: CategoryCardProps) {
  return (
    <div 
      className="relative rounded-lg overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-transform aspect-[16/9]"
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <img 
        src={image} 
        alt={name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h3 className="text-lg font-semibold text-white font-serif" data-testid="text-category-name">{name}</h3>
        <Badge variant="secondary" className="w-fit mt-2 bg-white/20 text-white border-white/30 backdrop-blur-sm" data-testid="badge-dish-count">
          {dishCount} dishes
        </Badge>
      </div>
    </div>
  );
}
