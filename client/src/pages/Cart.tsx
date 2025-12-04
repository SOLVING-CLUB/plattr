import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Cart() {
  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-4 text-center">
        <h1 className="text-xl font-bold">My Cart</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center container max-w-md mx-auto">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Looks like you haven't added any food to your cart yet.
        </p>
        <Link href="/menu">
          <Button size="lg" className="rounded-full px-8 font-bold">
            Browse Menu <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </main>
      
      <MobileNav />
    </div>
  );
}
