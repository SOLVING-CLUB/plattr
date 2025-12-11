import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

interface DishCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  quantity?: number;
}

export default function DishCard({ id, name, description, price, image, onAdd, onRemove, quantity = 0 }: DishCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden" data-testid={`card-dish-${id}`}>
      <div className="relative aspect-[16/9]">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="mb-2">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-base truncate flex-1" data-testid="text-dish-name">{name}</h3>
            <span className="text-xl font-bold text-primary font-serif flex-shrink-0" data-testid="text-dish-price">₹{price}</span>
          </div>
          <div>
            <p className={`text-sm text-muted-foreground ${!isExpanded ? 'line-clamp-2' : ''}`} data-testid="text-dish-description">
              {description}
            </p>
            {description.length > 80 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs text-primary hover:underline font-semibold"
                data-testid="button-toggle-description"
              >
                {isExpanded ? 'Show less' : '...more'}
              </button>
            )}
          </div>
        </div>
        
        {quantity === 0 ? (
          <Button 
            size="sm" 
            className="w-full mt-2" 
            onClick={() => onAdd(id)}
            data-testid="button-add-dish"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-2 bg-primary/10 rounded-full p-1" data-testid="control-quantity">
            <Button 
              size="icon" 
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={() => onRemove(id)}
              data-testid="button-decrease-quantity"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-semibold px-3" data-testid="text-quantity">{quantity}</span>
            <Button 
              size="icon" 
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={() => onAdd(id)}
              data-testid="button-increase-quantity"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
