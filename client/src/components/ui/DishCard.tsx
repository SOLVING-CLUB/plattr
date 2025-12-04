import { Dish } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Clock, Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DishCardProps {
  dish: Dish;
  className?: string;
}

export function DishCard({ dish, className }: DishCardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 group", className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={dish.imageUrl} 
          alt={dish.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {dish.dietaryType && (
            <Badge variant="secondary" className={cn(
              "backdrop-blur-md bg-white/90",
              dish.dietaryType === 'non-veg' ? "text-red-600 border-red-200" : "text-green-600 border-green-200"
            )}>
              <span className={cn("w-2 h-2 rounded-full mr-1.5", 
                dish.dietaryType === 'non-veg' ? "bg-red-500" : "bg-green-500"
              )} />
              {dish.dietaryType === 'non-veg' ? 'Non-Veg' : 'Veg'}
            </Badge>
          )}
          {dish.spiceLevel === 'spicy' && (
            <Badge variant="destructive" className="bg-red-500/90 backdrop-blur-md border-none text-white">
              Spicy
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-bold text-lg leading-tight text-foreground line-clamp-1">{dish.name}</h3>
          <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-700">{dish.rating}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 h-10">{dish.description}</p>
      </CardHeader>
      
      <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-border/50 bg-muted/20">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground line-through decoration-red-400/50 decoration-2">₹{Math.round(dish.price * 1.2)}</span>
          <span className="text-lg font-bold text-primary">₹{dish.price}</span>
        </div>
        
        <Button size="sm" className="rounded-full px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          Add <Plus className="w-4 h-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
