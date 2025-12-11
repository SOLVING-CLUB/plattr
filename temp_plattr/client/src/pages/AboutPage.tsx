import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Award, Users, Heart, Clock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('about');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setLocation('/');
    } else if (tab === 'categories') {
      setLocation('/categories/tiffins');
    } else if (tab === 'orders') {
      setLocation('/orders');
    } else if (tab === 'profile') {
      setLocation('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader 
        cartItemCount={0}
        onCartClick={() => setLocation('/cart')}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => setLocation('/')}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">About Us</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            We are Bangalore's premier catering and bulk meal service, dedicated to bringing authentic flavors and exceptional service to your events and daily needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Founded in 2015, we started with a simple mission: to make authentic South and North Indian cuisine accessible for events and daily meals. What began as a small kitchen operation has grown into one of Bangalore's most trusted catering services.
            </p>
            <p className="text-muted-foreground">
              Today, we serve thousands of customers monthly, from intimate family gatherings to large corporate events, always maintaining our commitment to quality, authenticity, and timely service.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-4">
              We believe great food brings people together. Our mission is to deliver restaurant-quality meals at scale, making celebrations and daily dining effortless and delicious.
            </p>
            <p className="text-muted-foreground">
              Every dish is prepared with fresh ingredients, traditional recipes, and modern hygiene standards. We're not just serving food; we're creating memorable experiences.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Us</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quality Assured</h3>
              <p className="text-sm text-muted-foreground">Fresh ingredients and authentic recipes in every dish</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">On-Time Delivery</h3>
              <p className="text-sm text-muted-foreground">Punctual service for all your events and daily meals</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Experienced Team</h3>
              <p className="text-sm text-muted-foreground">Skilled chefs with decades of combined experience</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Customer Focused</h3>
              <p className="text-sm text-muted-foreground">Dedicated to exceeding your expectations</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Our Numbers</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">8+</div>
              <p className="text-muted-foreground">Years of Service</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <p className="text-muted-foreground">Dishes Available</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Events Catered</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={0}
      />
    </div>
  );
}
