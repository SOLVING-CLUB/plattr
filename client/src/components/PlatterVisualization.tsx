import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, Sparkles, CheckCircle2, ArrowLeft, Truck, UtensilsCrossed, Box, X, Info, Check, Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useState } from "react";
import type { Dish, Category } from "@shared/schema";

interface CartItem {
  id: string;
  quantity: number;
  dish: Dish;
  category: Category;
}

interface PlatterVisualizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  paxCount: number;
  onPaxCountChange?: (count: number) => void;
  onProceedToCheckout: () => void;
}

type PlatterPartition = {
  id: string;
  label: string;
  items: CartItem[];
  redirectPath: string;
};

type ServiceType = 'bulk' | 'catering' | 'individual' | null;

export default function PlatterVisualization({
  open,
  onOpenChange,
  cartItems,
  paxCount,
  onPaxCountChange,
  onProceedToCheckout
}: PlatterVisualizationProps) {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<ServiceType>('bulk'); // Default to bulk delivery
  const [infoService, setInfoService] = useState<ServiceType>(null); // For showing info modal
  const [localPaxCount, setLocalPaxCount] = useState(paxCount)

  // Categorize items into platter partitions
  const categorizeItems = (items: CartItem[]): PlatterPartition[] => {
    const partitions: PlatterPartition[] = [
      { 
        id: 'main', 
        label: 'Main Food', 
        items: [], 
        redirectPath: '/categories/tiffins'
      },
      { 
        id: 'chutney', 
        label: 'Chutney', 
        items: [], 
        redirectPath: '/categories/snacks'
      },
      { 
        id: 'sambar', 
        label: 'Sambar', 
        items: [], 
        redirectPath: '/categories/lunch-dinner'
      },
      { 
        id: 'podi', 
        label: 'Podi', 
        items: [], 
        redirectPath: '/categories/snacks'
      },
      { 
        id: 'beverages', 
        label: 'Beverages', 
        items: [], 
        redirectPath: '/categories/lunch-dinner'
      },
      { 
        id: 'desserts', 
        label: 'Desserts', 
        items: [], 
        redirectPath: '/categories/snacks'
      }
    ];

    items.forEach(item => {
      const dishName = item.dish.name.toLowerCase();
      
      // Main food items (idli, dosa, vada, etc.)
      if (dishName.includes('idli') || dishName.includes('dosa') || dishName.includes('vada') || 
          dishName.includes('appam') || dishName.includes('puri') || dishName.includes('pongal') ||
          dishName.includes('biryani') || dishName.includes('rice') || dishName.includes('paratha')) {
        partitions[0].items.push(item);
      }
      // Chutney
      else if (dishName.includes('chutney')) {
        partitions[1].items.push(item);
      }
      // Sambar
      else if (dishName.includes('sambar') || dishName.includes('curry')) {
        partitions[2].items.push(item);
      }
      // Podi
      else if (dishName.includes('podi') || dishName.includes('powder')) {
        partitions[3].items.push(item);
      }
      // Beverages
      else if (dishName.includes('tea') || dishName.includes('coffee') || dishName.includes('juice') || 
               dishName.includes('mocktail') || dishName.includes('lassi') || dishName.includes('shake')) {
        partitions[4].items.push(item);
      }
      // Desserts
      else if (dishName.includes('payasam') || dishName.includes('halwa') || dishName.includes('sweet') || 
               dishName.includes('ladoo') || dishName.includes('kheer') || dishName.includes('dessert')) {
        partitions[5].items.push(item);
      }
      // Default to main food
      else {
        partitions[0].items.push(item);
      }
    });

    return partitions;
  };

  const partitions = categorizeItems(cartItems);
  const filledCount = partitions.filter(p => p.items.length > 0).length;
  const totalPrice = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.dish.price as string) * item.quantity * paxCount), 0
  );

  const handlePartitionClick = (partition: PlatterPartition) => {
    // Always allow navigation to add more items
    onOpenChange(false);
    setLocation(partition.redirectPath);
  };

  const renderPartitionContent = (partition: PlatterPartition) => {
    const isFilled = partition.items.length > 0;
    const displayItems = partition.items.slice(0, 2); // Show up to 2 items
    const remainingCount = partition.items.length - 2;

    if (isFilled) {
      return (
        <div className="relative flex flex-col items-center gap-1 sm:gap-2 w-full h-full justify-center">
          {/* Dish Names */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            {displayItems.map((item, idx) => (
              <div 
                key={idx}
                className="text-center bg-white/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm"
                data-testid={`text-item-${partition.id}-${idx}`}
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  {item.dish.name}
                </p>
              </div>
            ))}
          </div>
          {remainingCount > 0 && (
            <p className="text-xs text-gray-900 font-semibold bg-white/60 px-1.5 sm:px-2 py-0.5 rounded-full">
              +{remainingCount} more
            </p>
          )}
          {/* Plus button to add more */}
          <div className="mt-1 flex items-center justify-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
        </div>
      );
    }

    // Empty section - elegant invitation to add
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1.5">
        <div className="relative flex items-center justify-center">
          {/* Subtle pulsing glow */}
          <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-md animate-pulse" style={{ animationDuration: '3s' }} />
          {/* Plus button */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 hover:from-primary/90 hover:to-primary flex items-center justify-center transition-all duration-300 shadow-sm" data-testid={`button-add-${partition.id}`}>
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-white transition-colors" strokeWidth={2.5} />
          </div>
        </div>
        {/* Subtle hint text */}
        <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium opacity-70">
          Add items
        </p>
      </div>
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="inset-0 left-0 top-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none border-0 rounded-none sm:rounded-none p-3 sm:p-6 overflow-hidden flex flex-col bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30" 
        data-testid="dialog-platter"
        hideCloseButton={true}
      >
        <VisuallyHidden>
          <DialogTitle>Your Platter Visualization</DialogTitle>
          <DialogDescription>View your meal platter with sections for main food, chutney, sambar, podi, beverages, and desserts</DialogDescription>
        </VisuallyHidden>
        
        {/* Decorative food pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF6B35' fill-opacity='1'%3E%3Cpath d='M30 30m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
        
        {/* Back button - top left of page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute left-3 top-3 sm:left-6 sm:top-6 z-10"
          data-testid="button-back-platter"
          aria-label="Back to cart"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Header with icon and progress */}
        <div className="text-center mb-2 sm:mb-3 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900">Your Platter Preview</h2>
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-platter-summary">
            {filledCount} of 6 sections filled • {cartItems.length} items • {localPaxCount} pax
          </p>
          {/* Progress bar */}
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto mt-1.5">
            <div 
              className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${(filledCount / 6) * 100}%` }}
            />
          </div>
          
          {/* Pax Count Selector */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 mt-3 max-w-sm mx-auto border border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">Number of Pax</span>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="h-7 w-7 rounded-full"
                    onClick={() => {
                      const newCount = Math.max(10, localPaxCount - 10);
                      setLocalPaxCount(newCount);
                      onPaxCountChange?.(newCount);
                    }}
                    data-testid="button-decrease-pax"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    value={localPaxCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 10) {
                        setLocalPaxCount(value);
                        onPaxCountChange?.(value);
                      }
                    }}
                    onBlur={() => {
                      if (localPaxCount < 10) {
                        setLocalPaxCount(10);
                        onPaxCountChange?.(10);
                      }
                    }}
                    min={10}
                    max={500}
                    className="w-16 text-center text-base font-bold h-7 bg-white"
                    data-testid="input-pax-count"
                  />
                  <Button 
                    size="icon" 
                    variant="secondary"
                    className="h-7 w-7 rounded-full"
                    onClick={() => {
                      const newCount = Math.min(500, localPaxCount + 10);
                      setLocalPaxCount(newCount);
                      onPaxCountChange?.(newCount);
                    }}
                    data-testid="button-increase-pax"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <Slider
                value={[Math.min(localPaxCount, 500)]}
                onValueChange={(value) => {
                  setLocalPaxCount(value[0]);
                  onPaxCountChange?.(value[0]);
                }}
                min={10}
                max={500}
                step={10}
                className="w-full"
                data-testid="slider-pax"
              />
              
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>10 pax</span>
                <span>500+ pax</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platter Container - with max width and centered */}
        <div className="flex-1 min-h-0 flex items-center justify-center mb-2 sm:mb-3 px-2">
          <div 
            className="relative p-1.5 sm:p-4 rounded-[2.5rem] w-full" 
            style={{ 
              aspectRatio: '1/1',
              width: '100%',
              maxHeight: '100%',
              maxWidth: 'min(100%, 400px)',
              background: 'linear-gradient(135deg, #4A7C59 0%, #5D9B5D 25%, #6BAF6B 50%, #5D9B5D 75%, #4A7C59 100%)',
              boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.15), 0 6px 30px rgba(0,0,0,0.2)',
              border: '3px solid #3D6647'
            }}
          >
          {/* Leaf vein pattern overlay */}
          <div 
            className="absolute inset-0 rounded-[2.5rem] opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)',
              mixBlendMode: 'overlay'
            }}
          />

          {/* Grid layout mimicking real platter */}
          <div className="relative grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-3 h-full w-full">
            {/* Main Food - Large section (spans 2x2) */}
            <div
              className={`col-span-2 row-span-2 rounded-[2.5rem] p-1.5 sm:p-4 cursor-pointer transition-all hover-elevate flex flex-col items-center justify-between overflow-hidden ${
                partitions[0].items.length > 0 
                  ? 'border-0 bg-white/80' 
                  : 'border-2 border-dashed border-orange-300/60 bg-white/40'
              } backdrop-blur-sm`}
              onClick={() => handlePartitionClick(partitions[0])}
              data-testid="card-partition-main"
            >
              <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                {renderPartitionContent(partitions[0])}
              </div>
              <p className="font-semibold text-[10px] sm:text-sm text-gray-800 mt-0.5 sm:mt-2" data-testid="text-label-main">
                {partitions[0].label}
              </p>
            </div>

            {/* Chutney - Top right square */}
            <div
              className={`rounded-[2.5rem] p-1 sm:p-3 cursor-pointer transition-all hover-elevate flex flex-col items-center justify-center overflow-hidden ${
                partitions[1].items.length > 0 
                  ? 'border-0 bg-white/80' 
                  : 'border-2 border-dashed border-orange-300/60 bg-white/40'
              } backdrop-blur-sm`}
              onClick={() => handlePartitionClick(partitions[1])}
              data-testid="card-partition-chutney"
            >
              <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                {renderPartitionContent(partitions[1])}
              </div>
              <p className="font-semibold text-[9px] sm:text-xs text-gray-800 mt-0.5 sm:mt-1" data-testid="text-label-chutney">
                {partitions[1].label}
              </p>
            </div>

            {/* Sambar - Middle right square */}
            <div
              className={`rounded-[2.5rem] p-1 sm:p-3 cursor-pointer transition-all hover-elevate flex flex-col items-center justify-center overflow-hidden ${
                partitions[2].items.length > 0 
                  ? 'border-0 bg-white/80' 
                  : 'border-2 border-dashed border-orange-300/60 bg-white/40'
              } backdrop-blur-sm`}
              onClick={() => handlePartitionClick(partitions[2])}
              data-testid="card-partition-sambar"
            >
              <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                {renderPartitionContent(partitions[2])}
              </div>
              <p className="font-semibold text-[9px] sm:text-xs text-gray-800 mt-0.5 sm:mt-1" data-testid="text-label-sambar">
                {partitions[2].label}
              </p>
            </div>

            {/* Podi - Bottom left square */}
            <div
              className={`rounded-[2.5rem] p-1 sm:p-3 cursor-pointer transition-all hover-elevate flex flex-col items-center justify-center overflow-hidden ${
                partitions[3].items.length > 0 
                  ? 'border-0 bg-white/80' 
                  : 'border-2 border-dashed border-orange-300/60 bg-white/40'
              } backdrop-blur-sm`}
              onClick={() => handlePartitionClick(partitions[3])}
              data-testid="card-partition-podi"
            >
              <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                {renderPartitionContent(partitions[3])}
              </div>
              <p className="font-semibold text-[9px] sm:text-xs text-gray-800 mt-0.5 sm:mt-1" data-testid="text-label-podi">
                {partitions[3].label}
              </p>
            </div>

            {/* Beverages - Bottom middle square */}
            <div
              className={`rounded-[2.5rem] p-1 sm:p-3 cursor-pointer transition-all hover-elevate flex flex-col items-center justify-center overflow-hidden ${
                partitions[4].items.length > 0 
                  ? 'border-0 bg-white/80' 
                  : 'border-2 border-dashed border-orange-300/60 bg-white/40'
              } backdrop-blur-sm`}
              onClick={() => handlePartitionClick(partitions[4])}
              data-testid="card-partition-beverages"
            >
              <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                {renderPartitionContent(partitions[4])}
              </div>
              <p className="font-semibold text-[9px] sm:text-xs text-gray-800 mt-0.5 sm:mt-1" data-testid="text-label-beverages">
                {partitions[4].label}
              </p>
            </div>

            {/* Desserts - Bottom right square */}
            <div
              className={`rounded-[2.5rem] p-1 sm:p-3 cursor-pointer transition-all hover-elevate flex flex-col items-center justify-center overflow-hidden ${
                partitions[5].items.length > 0 
                  ? 'border-0 bg-white/80' 
                  : 'border-2 border-dashed border-orange-300/60 bg-white/40'
              } backdrop-blur-sm`}
              onClick={() => handlePartitionClick(partitions[5])}
              data-testid="card-partition-desserts"
            >
              <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                {renderPartitionContent(partitions[5])}
              </div>
              <p className="font-semibold text-[9px] sm:text-xs text-gray-800 mt-0.5 sm:mt-1" data-testid="text-label-desserts">
                {partitions[5].label}
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Achievement Banner */}
        {filledCount === 6 && (
          <div className="mb-2 sm:mb-3 flex-shrink-0">
            <div className="flex items-center gap-2 justify-center px-2 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs sm:text-sm font-semibold text-green-700">Complete Platter! Perfect meal combination</p>
            </div>
          </div>
        )}

        {/* Type of Meal Service Section */}
        <div className="mb-3 flex-shrink-0 px-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 text-center">
            Type of Meal Service
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-600 text-center mb-2">
            Select your preferred service type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Hot Bulk Food Delivery */}
            <div 
              className={`relative rounded-lg border-2 p-2 pt-3 flex flex-col items-center cursor-pointer transition-all ${
                selectedService === 'bulk' 
                  ? 'border-primary bg-orange-100 shadow-md' 
                  : 'border-orange-200 bg-orange-50 hover-elevate'
              }`}
              onClick={() => setSelectedService('bulk')}
              data-testid="card-service-bulk"
            >
              {/* Large clear radio checkbox */}
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[3px] flex items-center justify-center mb-2 transition-all ${
                selectedService === 'bulk' 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-400 bg-white'
              }`}>
                {selectedService === 'bulk' && (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white font-bold stroke-[3]" />
                )}
              </div>
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-200 flex items-center justify-center mb-1">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <p className="text-[9px] sm:text-xs font-medium text-gray-900 text-center mb-1 leading-tight">
                Hot Bulk Food Delivery
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoService('bulk');
                }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-200 hover:bg-orange-300 flex items-center justify-center transition-colors"
                data-testid="button-info-bulk"
                aria-label="More information about Hot Bulk Food Delivery"
              >
                <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-700" />
              </button>
            </div>

            {/* Catering Service */}
            <div 
              className={`relative rounded-lg border-2 p-2 pt-3 flex flex-col items-center cursor-pointer transition-all ${
                selectedService === 'catering' 
                  ? 'border-primary bg-orange-100 shadow-md' 
                  : 'border-orange-200 bg-orange-50 hover-elevate'
              }`}
              onClick={() => setSelectedService('catering')}
              data-testid="card-service-catering"
            >
              {/* Large clear radio checkbox */}
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[3px] flex items-center justify-center mb-2 transition-all ${
                selectedService === 'catering' 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-400 bg-white'
              }`}>
                {selectedService === 'catering' && (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white font-bold stroke-[3]" />
                )}
              </div>
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-200 flex items-center justify-center mb-1">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <p className="text-[9px] sm:text-xs font-medium text-gray-900 text-center mb-1 leading-tight">
                Catering Service
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoService('catering');
                }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-200 hover:bg-orange-300 flex items-center justify-center transition-colors"
                data-testid="button-info-catering"
                aria-label="More information about Catering Service"
              >
                <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-700" />
              </button>
            </div>

            {/* Individual Meal Boxes */}
            <div 
              className={`relative rounded-lg border-2 p-2 pt-3 flex flex-col items-center cursor-pointer transition-all ${
                selectedService === 'individual' 
                  ? 'border-primary bg-orange-100 shadow-md' 
                  : 'border-orange-200 bg-orange-50 hover-elevate'
              }`}
              onClick={() => setSelectedService('individual')}
              data-testid="card-service-individual"
            >
              {/* Large clear radio checkbox */}
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[3px] flex items-center justify-center mb-2 transition-all ${
                selectedService === 'individual' 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-400 bg-white'
              }`}>
                {selectedService === 'individual' && (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white font-bold stroke-[3]" />
                )}
              </div>
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-200 flex items-center justify-center mb-1">
                <Box className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <p className="text-[9px] sm:text-xs font-medium text-gray-900 text-center mb-1 leading-tight">
                Individual Meal Boxes
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoService('individual');
                }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-200 hover:bg-orange-300 flex items-center justify-center transition-colors"
                data-testid="button-info-individual"
                aria-label="More information about Individual Meal Boxes"
              >
                <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 px-1 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Total Amount</p>
            <p className="text-xl sm:text-2xl font-bold text-primary" data-testid="text-platter-total">
              ₹{totalPrice.toFixed(0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">For {paxCount} pax</p>
            <p className="text-sm sm:text-base font-semibold text-gray-900">{cartItems.length} items</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1 text-xs sm:text-sm h-10 sm:h-11"
            onClick={() => onOpenChange(false)}
            data-testid="button-back-to-cart"
          >
            Back to Cart
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm h-10 sm:h-11"
            onClick={() => {
              // Store that we should reopen platter when returning
              sessionStorage.setItem('shouldReopenPlatter', 'true');
              onOpenChange(false);
              setLocation('/add-ons', { state: { serviceType: selectedService } });
            }}
            data-testid="button-confirm-checkout"
          >
            Proceed to Add-ons
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Service Detail Sheet */}
    <Sheet open={infoService !== null} onOpenChange={() => setInfoService(null)}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="relative pb-4 border-b">
          <button
            onClick={() => setInfoService(null)}
            className="absolute right-0 top-0 p-2 rounded-full hover-elevate active-elevate-2"
            data-testid="button-close-service-detail"
            aria-label="Close service details"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <SheetTitle className="text-xl font-bold text-gray-900 pr-10">
            {infoService === 'bulk' && 'Hot Bulk Food Delivery'}
            {infoService === 'catering' && 'Catering Service'}
            {infoService === 'individual' && 'Individual Meal Boxes'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Detailed information about the selected meal service type
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 overflow-y-auto pb-6 max-h-[calc(85vh-120px)]">
          {selectedService === 'bulk' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-semibold text-gray-900 mb-2">What is Hot Bulk Food Delivery?</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  We provide all your requested dishes in our proprietary dish packaging boxes that are 
                  specially designed to maintain the heat and quality of the food intact during transit 
                  and service.
                </p>

                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Food delivered in premium, heat-retaining packaging boxes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Maintains temperature and freshness throughout your event</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>No serving staff included (self-service setup)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Perfect for office meetings, small gatherings, and events where you have your own serving arrangements</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-900 mb-1">Need serving staff?</p>
                  <p className="text-xs text-amber-800">
                    You can add serving boys as an optional add-on to your order if required.
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-2 mt-4">Best suited for:</h4>
                <p className="text-sm text-gray-700">
                  Corporate events, office lunches, small parties, meetings, and occasions where 
                  you prefer self-service or have your own serving arrangements.
                </p>
              </div>
            </div>
          )}

          {selectedService === 'catering' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-primary" />
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-semibold text-gray-900 mb-2">What is Catering Service?</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  A complete, full-service catering experience where we handle everything from food 
                  preparation to service. Our professional team sets up a complete catering counter 
                  with serving staff to ensure your guests are well taken care of.
                </p>

                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Complete catering counter setup at your venue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Professional serving boys assigned to each dish</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Full-service experience for your guests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Professional presentation and serving equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Staff manages refills, cleanliness, and guest service throughout the event</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-900 mb-1">Hassle-Free Experience</p>
                  <p className="text-xs text-green-800">
                    Our team handles setup, service, and cleanup so you can focus on your guests and enjoy your event.
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-2 mt-4">Best suited for:</h4>
                <p className="text-sm text-gray-700">
                  Weddings, large corporate events, parties, festivals, and special occasions where 
                  you want a professional, full-service dining experience for your guests.
                </p>
              </div>
            </div>
          )}

          {selectedService === 'individual' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <Box className="w-8 h-8 text-primary" />
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-semibold text-gray-900 mb-2">What are Individual Meal Boxes?</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  Customized, individually portioned meal boxes where each person gets their own 
                  assorted tiffin box with their selected items. Perfect for personalized dining 
                  experiences and convenient distribution.
                </p>

                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Each person receives their own individual tiffin box</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Create customized assorted meal combinations per box</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Packed in our premium, proprietary meal box packaging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Hygienic, contactless meal distribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Easy to distribute and serve at your event</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">Personalized & Convenient</p>
                  <p className="text-xs text-blue-800">
                    Each meal box is carefully assembled with your chosen items, ensuring consistent 
                    portions and quality for every guest.
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-2 mt-4">Best suited for:</h4>
                <p className="text-sm text-gray-700">
                  Corporate lunch meetings, training sessions, outdoor events, picnics, team outings, 
                  and any occasion where individual, grab-and-go meal boxes are more practical than buffet-style service.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
            onClick={() => setSelectedService(null)}
            data-testid="button-got-it"
          >
            Got it, thanks!
          </Button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
