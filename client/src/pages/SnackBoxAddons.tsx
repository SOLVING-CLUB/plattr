import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useCart } from "@/context/CartContex";

import chefHatIcon from "@assets/tabler_chef-hat-filled_1763917839168.png";
import servingStaffIcon from "@assets/ic_baseline-people_1763917839170.png";
import decorIcon from "@assets/streamline-ultimate_party-decoration-bold_1763917839170.png";
import tablewareIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import musicIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import cameraIcon from "@assets/mdi_camera3_1763917839155.png";

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

                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Select Add-Ons
                        </h2>
                        <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
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

                <div className="space-y-4 mb-6">
                    {/* Reuse standard addons but with snack-box prefix for storage if needed */}
                    {[
                        { id: 'cooking', title: 'Live Cooking Counters', desc: 'Professional chefs prepare food live at your event location.', icon: chefHatIcon },
                        { id: 'staff', title: 'Serving Staff', desc: 'Professional serving staff to help set up, serve, and manage your food.', icon: servingStaffIcon },
                        { id: 'decor', title: 'Decor', desc: 'Transform your event space with professional theme-based decoration.', icon: decorIcon },
                        { id: 'tableware', title: 'Tableware & Crockery', desc: 'Premium biodegradable tableware and cutlery for a sustainable event.', icon: tablewareIcon },
                        { id: 'music', title: 'Live Music', desc: 'Music performance that entertains your guests.', icon: musicIcon },
                        { id: 'photography', title: 'Photography', desc: 'Professional photography to capture memories.', icon: cameraIcon },
                    ].map((addon) => (
                        <div
                            key={addon.id}
                            className="flex items-start gap-4 p-4 border-2 rounded-lg"
                            style={{
                                borderColor: selectedAddOns.includes(addon.id) ? "#1A9952" : "#E5E7EB",
                                backgroundColor: selectedAddOns.includes(addon.id) ? "#F0F9F4" : "white"
                            }}
                        >
                            <img src={addon.icon} alt={addon.title} className="w-12 h-12 object-contain flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    {addon.title}
                                </h3>
                                <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                                    {addon.desc}
                                </p>
                            </div>
                            <button
                                onClick={() => toggleAddon(addon.id)}
                                className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                                style={{
                                    borderColor: "#1A9952",
                                    backgroundColor: selectedAddOns.includes(addon.id) ? "#1A9952" : "white"
                                }}
                            >
                                {selectedAddOns.includes(addon.id) && <Check className="w-4 h-4 text-white" />}
                            </button>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={() => setLocation("/snack-box-delivery")}
                    className="w-full py-6 text-lg font-semibold border-0"
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
