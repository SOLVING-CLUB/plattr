import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGoBack } from "@/hooks/useGoBack";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Info, ChefHat, Users, Palette, UtensilsCrossed, Music, Wine, X, CheckCircle2, Camera, Disc3, Mic2, Car } from "lucide-react";
import type { AddOn } from "@shared/schema";

type ServiceType = 'bulk' | 'catering' | 'individual';

const addOnIcons = {
  'Live Cooking Counters': ChefHat,
  'Serving Staff': Users,
  'Decor': Palette,
  'Tableware & Crockery': UtensilsCrossed,
  'Live Music': Music,
  'Bartender': Wine,
  'Photography': Camera,
  'DJ Services': Disc3,
  'MC/Host Services': Mic2,
  'Valet Parking': Car,
};

const addOnDetails = {
  'Live Cooking Counters': {
    description: 'Professional chefs prepare food live at your event location, offering a unique culinary experience.',
    features: [
      'Experienced chefs with specialized cooking equipment',
      'Live food preparation stations for interactive dining',
      'Fresh, hot food served directly to guests',
      'Perfect for events wanting a premium, theatrical element'
    ],
    bestFor: 'Corporate events, weddings, high-end gatherings where presentation matters',
    tip: 'Requires minimum 50 guests and advance booking of 48 hours'
  },
  'Serving Staff': {
    description: 'Professional serving staff to help set up, serve, and manage your food during the event.',
    features: [
      'Trained service professionals in uniform',
      'Complete setup and breakdown service',
      'Continuous food replenishment and table management',
      'Available for 4-hour event duration'
    ],
    bestFor: 'Office meetings, small gatherings where you need professional serving',
    tip: 'Ideal add-on for Hot Bulk Delivery to ensure smooth service'
  },
  'Decor': {
    description: 'Transform your event space with professional theme-based decoration and ambiance setup.',
    features: [
      'Customized theme-based decoration',
      'Table centerpieces and backdrop setup',
      'Lighting and ambiance creation',
      'Professional setup and teardown'
    ],
    bestFor: 'Birthday parties, corporate events, special celebrations',
    tip: 'Consultation required 72 hours before event for theme selection'
  },
  'Tableware & Crockery': {
    description: 'Premium quality plates, cutlery, glasses, and serving dishes for elegant dining presentation.',
    features: [
      'High-quality ceramic plates and bowls',
      'Stainless steel cutlery sets',
      'Glassware and serving platters',
      'Includes pickup and cleaning service'
    ],
    bestFor: 'Events requiring elegant presentation without catering setup',
    tip: 'Deposit required; returned after item verification'
  },
  'Live Music': {
    description: 'Live musicians to create the perfect ambiance for your event with traditional or contemporary performances.',
    features: [
      'Professional musicians with complete setup',
      'Choice of classical, fusion, or contemporary styles',
      '2-3 hour performance duration',
      'Sound system included'
    ],
    bestFor: 'Weddings, corporate galas, cultural events',
    tip: 'Book at least 1 week in advance for artist availability'
  },
  'Bartender': {
    description: 'Skilled bartenders to craft mocktails and manage beverage service at your event.',
    features: [
      'Professional bartenders with mixing equipment',
      'Mocktail menu with creative presentations',
      'Bar setup and management',
      '4-hour service duration'
    ],
    bestFor: 'Corporate parties, social gatherings, networking events',
    tip: 'Beverages and ingredients charged separately'
  },
  'Photography': {
    description: 'Professional photography and videography services to capture all the memorable moments of your event.',
    features: [
      'Experienced photographers with professional equipment',
      'High-resolution photos and HD video recording',
      'Edited photos delivered within 7 days',
      'Online gallery for easy sharing'
    ],
    bestFor: 'Weddings, corporate events, birthday parties, any special celebration',
    tip: 'Book at least 2 weeks in advance for availability'
  },
  'DJ Services': {
    description: 'Professional DJ with sound system and lighting to keep your guests entertained throughout the event.',
    features: [
      'Professional DJ with extensive music library',
      'Complete sound system and DJ equipment',
      'Stage lighting and effects',
      'Customized playlist based on your preferences'
    ],
    bestFor: 'Parties, corporate events, weddings, social gatherings',
    tip: 'Discuss music preferences during consultation call'
  },
  'MC/Host Services': {
    description: 'Experienced master of ceremonies to host and coordinate your event professionally.',
    features: [
      'Professional event host/emcee',
      'Complete event flow management',
      'Engaging guest interaction',
      'Bilingual hosting available (English/Hindi)'
    ],
    bestFor: 'Corporate events, award ceremonies, weddings, large gatherings',
    tip: 'Share event agenda in advance for smooth coordination'
  },
  'Valet Parking': {
    description: 'Professional valet parking service to manage guest parking efficiently.',
    features: [
      'Trained valet attendants',
      'Organized parking management',
      'Vehicle safety and security',
      'Quick retrieval service'
    ],
    bestFor: 'Large events with limited parking space, upscale gatherings',
    tip: 'Available for venues with designated parking areas'
  }
};

export default function AddOnsPage() {
  const [, setLocation] = useLocation();
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [infoAddOn, setInfoAddOn] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>('bulk');
  const { toast } = useToast();
  const goBack = useGoBack('/checkout');

  // Get service type from navigation state
  useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.serviceType) {
      setServiceType(state.serviceType);
    }
  }, []);

  // Fetch all add-ons
  const { data: addOns = [], isLoading } = useQuery<AddOn[]>({
    queryKey: ['/api/add-ons'],
  });

  // Filter add-ons based on service type
  const getFilteredAddOns = () => {
    return addOns.filter(addOn => {
      if (serviceType === 'bulk') {
        // Show ALL add-ons for Hot Bulk Food Delivery
        return true;
      } else if (serviceType === 'catering') {
        // Hide Tableware, Decor, and Serving Staff for Catering Service
        return !['Tableware & Crockery', 'Decor', 'Serving Staff'].includes(addOn.name);
      } else if (serviceType === 'individual') {
        // Hide Live Cooking Counters and Serving Staff for Individual Meal Boxes
        return !['Live Cooking Counters', 'Serving Staff'].includes(addOn.name);
      }
      return true;
    });
  };

  const filteredAddOns = getFilteredAddOns();

  const handleToggleAddOn = (addOnId: string) => {
    const newSelection = new Set(selectedAddOns);
    const addOn = addOns.find(a => a.id === addOnId);
    
    if (newSelection.has(addOnId)) {
      newSelection.delete(addOnId);
    } else {
      newSelection.add(addOnId);
      // Show "You will get a call" message
      if (addOn) {
        toast({
          title: `${addOn.name} Selected!`,
          description: "Our team will call you to discuss the details and finalize your requirements.",
          duration: 4000,
        });
      }
    }
    setSelectedAddOns(newSelection);
  };

  const calculateTotal = () => {
    return Array.from(selectedAddOns).reduce((sum, id) => {
      const addOn = addOns.find(a => a.id === id);
      return sum + (addOn ? parseFloat(addOn.price as string) : 0);
    }, 0);
  };

  const handleProceedToCheckout = () => {
    // Navigate to checkout with selected add-ons
    setLocation('/checkout', { 
      state: { 
        selectedAddOns: Array.from(selectedAddOns),
        serviceType 
      } 
    });
  };

  const getServiceTypeName = () => {
    switch(serviceType) {
      case 'bulk': return 'Hot Bulk Food Delivery';
      case 'catering': return 'Catering Service';
      case 'individual': return 'Individual Meal Boxes';
      default: return '';
    }
  };

  const Icon = infoAddOn ? addOnIcons[infoAddOn as keyof typeof addOnIcons] : null;
  const details = infoAddOn ? addOnDetails[infoAddOn as keyof typeof addOnDetails] : null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <button
            onClick={goBack}
            className="p-2 -ml-2 hover-elevate active-elevate-2 rounded-lg"
            data-testid="button-back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Enhance Your Event</h1>
            <p className="text-xs text-muted-foreground">{getServiceTypeName()}</p>
          </div>
          <div className="w-9 sm:w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-900">
              Select optional add-ons to make your event more memorable. You can skip this step if you don't need any extras.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredAddOns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No add-ons available for your selected service type.</p>
              <Button 
                onClick={handleProceedToCheckout} 
                className="mt-4"
                data-testid="button-skip-addons"
              >
                Proceed to Checkout
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
              {filteredAddOns.map((addOn) => {
                const IconComponent = addOnIcons[addOn.name as keyof typeof addOnIcons];
                const isSelected = selectedAddOns.has(addOn.id);

                return (
                  <div
                    key={addOn.id}
                    className={`relative border rounded-lg p-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-orange-50 shadow-md' 
                        : 'border-border bg-card hover-elevate'
                    }`}
                    onClick={() => handleToggleAddOn(addOn.id)}
                    data-testid={`card-addon-${addOn.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-3 left-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleAddOn(addOn.id)}
                        className="w-5 h-5"
                        data-testid={`checkbox-addon-${addOn.name.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                    </div>

                    {/* Info Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoAddOn(addOn.name);
                      }}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                      data-testid={`button-info-${addOn.name.toLowerCase().replace(/\s+/g, '-')}`}
                      aria-label={`More information about ${addOn.name}`}
                    >
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    {/* Content */}
                    <div className="ml-8 mr-8">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          {IconComponent && <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                            {addOn.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {addOn.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-primary">
                          ₹{parseFloat(addOn.price as string).toFixed(0)}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-medium text-primary flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      {filteredAddOns.length > 0 && (
        <div className="flex-shrink-0 border-t bg-card p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {selectedAddOns.size} add-on{selectedAddOns.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xl font-bold text-primary">
                +₹{calculateTotal().toFixed(0)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                data-testid="button-skip"
              >
                Skip
              </Button>
              <Button
                onClick={handleProceedToCheckout}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-proceed-checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info Sheet */}
      <Sheet open={infoAddOn !== null} onOpenChange={() => setInfoAddOn(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="relative pb-4 border-b">
            <button
              onClick={() => setInfoAddOn(null)}
              className="absolute right-0 top-0 p-2 rounded-full hover-elevate active-elevate-2"
              data-testid="button-close-info"
              aria-label="Close add-on details"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <SheetTitle className="text-xl font-bold text-foreground pr-10">
              {infoAddOn}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Detailed information about {infoAddOn}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 overflow-y-auto pb-6 max-h-[calc(85vh-120px)]">
            {Icon && details && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-base font-semibold text-foreground mb-2">What is this?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {details.description}
                  </p>

                  <h4 className="text-sm font-semibold text-foreground mb-2">Key Features:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {details.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-900 mb-1">Important Note:</p>
                    <p className="text-xs text-amber-800">
                      {details.tip}
                    </p>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground mb-2 mt-4">Best suited for:</h4>
                  <p className="text-sm text-muted-foreground">{details.bestFor}</p>
                </div>

                <Button
                  onClick={() => setInfoAddOn(null)}
                  className="w-full mt-6"
                  data-testid="button-got-it"
                >
                  Got it, thanks!
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
