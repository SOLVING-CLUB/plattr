import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContex";

// Cutlery addon images
import servingSpoonIcon from "@assets/serving spoons.PNG?url";
import spoonForkIcon from "@assets/fork and spoon wooden.PNG?url";
import plateIcon from "@assets/wooden_plate.PNG?url";
import waterBottleIcon from "@assets/water bottle.PNG?url";
import tissueIcon from "@assets/tissues.PNG?url";

const SNACK_BOX_ADDONS_KEY = "snackBoxAddons";

export default function SnackBoxAddons() {
    const [, setLocation] = useLocation();
    const { cart } = useCart();


    const [selectedAddOns, setSelectedAddOns] = useState<string[]>(() => {
        const stored = localStorage.getItem(SNACK_BOX_ADDONS_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return [];
            }
        }
        return [];
    });

    // Quantity state for Serving Spoons (per piece pricing)
    const [servingSpoonQuantity, setServingSpoonQuantity] = useState<number>(() => {
        const stored = localStorage.getItem(`${SNACK_BOX_ADDONS_KEY}_serving_spoon_qty`);
        if (stored) {
            try {
                return parseInt(stored) || 0;
            } catch {
                return 0;
            }
        }
        return 0;
    });

    useEffect(() => {
        if (cart.length === 0) {
            setLocation("/snack-box");
        }
    }, [cart.length, setLocation]);

    const saveAddons = (addons: string[]) => {
        localStorage.setItem(SNACK_BOX_ADDONS_KEY, JSON.stringify(addons));
        setSelectedAddOns(addons);
    };

    const toggleAddon = (addonId: string) => {
        const newAddons = selectedAddOns.includes(addonId)
            ? selectedAddOns.filter(id => id !== addonId)
            : [...selectedAddOns, addonId];
        saveAddons(newAddons);
        
        // Reset quantity when unselecting serving spoons
        if (addonId === 'serving_spoons' && !newAddons.includes('serving_spoons')) {
            setServingSpoonQuantity(0);
            localStorage.removeItem(`${SNACK_BOX_ADDONS_KEY}_serving_spoon_qty`);
        }
    };

    const updateServingSpoonQuantity = (quantity: number) => {
        setServingSpoonQuantity(quantity);
        localStorage.setItem(`${SNACK_BOX_ADDONS_KEY}_serving_spoon_qty`, quantity.toString());
        // Auto-select if quantity > 0
        if (quantity > 0 && !selectedAddOns.includes('serving_spoons')) {
            saveAddons([...selectedAddOns, 'serving_spoons']);
        } else if (quantity === 0 && selectedAddOns.includes('serving_spoons')) {
            saveAddons(selectedAddOns.filter(id => id !== 'serving_spoons'));
        }
    };

    const totalServings = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white pb-24">
            <div className="bg-white px-4 pt-16 pb-4 border-b border-gray-100 sticky top-0 z-50">
                <button
                    onClick={() => setLocation("/snack-box-cart")}
                    className="flex items-center gap-2 text-gray-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
                </button>
            </div>

            <div className="px-4 py-6">
                <div className="mb-6">
                    <div className="flex gap-2">
                        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                    </div>
                </div>

                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Select Add-Ons
                        </h2>
                        <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: "Sweet Sans Pro" }}>
                            For {totalServings} serves from Snack Boxes
                        </p>
                    </div>
                    <Button
                        onClick={() => setLocation("/snack-box-delivery")}
                        variant="ghost"
                        className="text-sm font-semibold px-4 py-2"
                        style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}
                    >
                        SKIP →
                    </Button>
                </div>

                {/* Add-Ons List - Cutlery */}
                <div className="space-y-4 mb-8">
                    {/* Serving Spoons - ₹20 per piece */}
                    <div
                        className="flex items-center gap-3 p-4 border-2 rounded-lg"
                        style={{
                            borderColor: servingSpoonQuantity > 0 ? "#1A9952" : "#E5E7EB",
                            backgroundColor: servingSpoonQuantity > 0 ? "#F0F9F4" : "white"
                        }}
                    >
                        <img src={servingSpoonIcon} alt="Serving Spoons" className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-base flex-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Serving Spoons
                                </h3>
                                <span className="text-sm font-semibold ml-4 flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    ₹20/piece
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={() => updateServingSpoonQuantity(Math.max(0, servingSpoonQuantity - 1))}
                                    className="w-8 h-8 rounded border-2 flex items-center justify-center"
                                    style={{
                                        borderColor: "#1A9952",
                                        backgroundColor: servingSpoonQuantity > 0 ? "#1A9952" : "white"
                                    }}
                                    disabled={servingSpoonQuantity === 0}
                                >
                                    <Minus className={`w-4 h-4 ${servingSpoonQuantity > 0 ? "text-white" : "text-gray-400"}`} />
                                </button>
                                <span className="text-base font-semibold min-w-[2rem] text-center" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    {servingSpoonQuantity}
                                </span>
                                <button
                                    onClick={() => updateServingSpoonQuantity(servingSpoonQuantity + 1)}
                                    className="w-8 h-8 rounded border-2 flex items-center justify-center"
                                    style={{
                                        borderColor: "#1A9952",
                                        backgroundColor: "#1A9952"
                                    }}
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Spoons & Forks - Free */}
                    <div
                        className="flex items-center gap-3 p-4 border-2 rounded-lg"
                        style={{
                            borderColor: selectedAddOns.includes('spoons_forks') ? "#1A9952" : "#E5E7EB",
                            backgroundColor: selectedAddOns.includes('spoons_forks') ? "#F0F9F4" : "white"
                        }}
                    >
                        <img src={spoonForkIcon} alt="Spoons & Forks" className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-base flex-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Spoons & Forks
                                </h3>
                                <span className="text-sm font-semibold text-green-600 ml-4 flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro" }}>
                                    Free
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAddon('spoons_forks')}
                            className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                                borderColor: "#1A9952",
                                backgroundColor: selectedAddOns.includes('spoons_forks') ? "#1A9952" : "white"
                            }}
                            data-testid="addon-spoons-forks"
                        >
                            {selectedAddOns.includes('spoons_forks') && <Check className="w-4 h-4 text-white" />}
                        </button>
                    </div>

                    {/* Plates - ₹10 */}
                    <div
                        className="flex items-center gap-3 p-4 border-2 rounded-lg"
                        style={{
                            borderColor: selectedAddOns.includes('plates') ? "#1A9952" : "#E5E7EB",
                            backgroundColor: selectedAddOns.includes('plates') ? "#F0F9F4" : "white"
                        }}
                    >
                        <img src={plateIcon} alt="Plates" className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-base flex-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Plates
                                </h3>
                                <span className="text-sm font-semibold ml-4 flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    ₹10
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAddon('plates')}
                            className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                                borderColor: "#1A9952",
                                backgroundColor: selectedAddOns.includes('plates') ? "#1A9952" : "white"
                            }}
                            data-testid="addon-plates"
                        >
                            {selectedAddOns.includes('plates') && <Check className="w-4 h-4 text-white" />}
                        </button>
                    </div>

                    {/* Water Bottles - ₹10 */}
                    <div
                        className="flex items-start gap-4 p-4 border-2 rounded-lg"
                        style={{
                            borderColor: selectedAddOns.includes('water_bottles') ? "#1A9952" : "#E5E7EB",
                            backgroundColor: selectedAddOns.includes('water_bottles') ? "#F0F9F4" : "white"
                        }}
                    >
                        <img src={waterBottleIcon} alt="Water Bottles" className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Water Bottles
                                </h3>
                                <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    ₹10
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAddon('water_bottles')}
                            className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                                borderColor: "#1A9952",
                                backgroundColor: selectedAddOns.includes('water_bottles') ? "#1A9952" : "white"
                            }}
                            data-testid="addon-water-bottles"
                        >
                            {selectedAddOns.includes('water_bottles') && <Check className="w-4 h-4 text-white" />}
                        </button>
                    </div>

                    {/* Tissues - Free */}
                    <div
                        className="flex items-center gap-3 p-4 border-2 rounded-lg"
                        style={{
                            borderColor: selectedAddOns.includes('tissues') ? "#1A9952" : "#E5E7EB",
                            backgroundColor: selectedAddOns.includes('tissues') ? "#F0F9F4" : "white"
                        }}
                    >
                        <img src={tissueIcon} alt="Tissues" className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-base flex-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Tissues
                                </h3>
                                <span className="text-sm font-semibold text-green-600 ml-4 flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro" }}>
                                    Free
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAddon('tissues')}
                            className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                                borderColor: "#1A9952",
                                backgroundColor: selectedAddOns.includes('tissues') ? "#1A9952" : "white"
                            }}
                            data-testid="addon-tissues"
                        >
                            {selectedAddOns.includes('tissues') && <Check className="w-4 h-4 text-white" />}
                        </button>
                    </div>
                </div>

                <Button
                    onClick={() => setLocation("/snack-box-delivery")}
                    className="w-full py-6 text-lg font-semibold border-0 mt-6"
                    style={{
                        fontFamily: "Sweet Sans Pro",
                        backgroundColor: "#1A9952",
                        color: "white",
                        borderRadius: "10px"
                    }}
                >
                    Enter Delivery Details →
                </Button>
            </div>


        </div>
    );
}
