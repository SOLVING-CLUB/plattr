import { useState } from "react";
import { CATEGORIES, DISHES } from "@/lib/mockData";
import { DishCard } from "@/components/ui/DishCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MobileNav } from "@/components/layout/MobileNav";

export default function Menu() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDishes = DISHES.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || dish.mealType.includes(activeTab as any);
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search dishes..." 
              className="pl-9 bg-muted/50 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl border-none bg-muted/50">
            <Filter className="w-4 h-4 text-foreground" />
          </Button>
        </div>
      </header>

      <main className="container max-w-md mx-auto pt-6 px-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto bg-transparent p-0 gap-2 mb-6 overflow-x-auto justify-start">
            <TabsTrigger 
              value="all"
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all"
            >
              All
            </TabsTrigger>
            {CATEGORIES.map(cat => (
              <TabsTrigger 
                key={cat.mealType} 
                value={cat.mealType}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary transition-all whitespace-nowrap"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No dishes found</p>
              </div>
            )}
          </div>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}
