import { useState } from "react";
import { CATEGORIES, DISHES } from "@/lib/mockData";
import { DishCard } from "@/components/ui/DishCard";
import { Input } from "@/components/ui/input";
import { Search, Bell, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/layout/MobileNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Delivering to</span>
            <div className="flex items-center gap-1 text-primary font-bold">
              <MapPin className="w-3.5 h-3.5 fill-current" />
              <span>Home • 123 Main St</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-background" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search for 'Biryani'" 
            className="pl-9 bg-muted/50 border-none h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </header>

      <main className="container max-w-md mx-auto space-y-8 pt-6 px-4">
        {/* Categories */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Categories</h2>
            <Button variant="link" className="text-primary text-xs p-0 h-auto">See all</Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4">
            <div className="flex gap-4 pb-4">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="flex flex-col items-center space-y-2 group cursor-pointer">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors p-0.5">
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{category.name}</span>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </section>

        {/* Featured Banner */}
        <section className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={DISHES[2].imageUrl} 
            alt="Special Offer" 
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-6">
            <Badge className="w-fit mb-2 bg-primary hover:bg-primary border-none text-white">Limited Offer</Badge>
            <h3 className="text-white text-2xl font-display font-bold mb-1">Biryani Fest</h3>
            <p className="text-white/80 text-xs mb-3">Get 20% off on all Biryanis</p>
            <Button size="sm" variant="secondary" className="w-fit rounded-full h-8 text-xs">Order Now</Button>
          </div>
        </section>

        {/* Popular Dishes */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Popular Now</h2>
            <Button variant="link" className="text-primary text-xs p-0 h-auto">View all</Button>
          </div>
          <div className="grid gap-6">
            {DISHES.slice(0, 3).map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </section>
      </main>
      
      <MobileNav />
    </div>
  );
}
