import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface MealTypeCardProps {
  title: string;
  icon: LucideIcon;
  itemCount: number;
  onClick: () => void;
  imageUrl?: string;
}

export default function MealTypeCard({ title, icon: Icon, itemCount, onClick, imageUrl }: MealTypeCardProps) {
  return (
    <Card 
      className="cursor-pointer hover-elevate active-elevate-2 transition-transform overflow-hidden h-full" 
      onClick={onClick}
      data-testid={`card-mealtype-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Image Section */}
      <div className="relative h-40 md:h-48 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Icon className="w-16 h-16 text-primary/40" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Icon overlay */}
        <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-bold font-serif text-xl mb-2" data-testid={`text-mealtype-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs" data-testid="badge-item-count">
            {itemCount} items
          </Badge>
          <span className="text-xs text-primary font-semibold">Browse →</span>
        </div>
      </div>
    </Card>
  );
}
