// import {
//   Search,
//   Mic,
//   ShoppingCart,
//   MapPin,
//   ChevronRight,
//   ArrowRight,
//   Home as HomeIcon,
//   Menu as MenuIcon,
//   User,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { useLocation } from "wouter";
// import { Badge } from "@/components/ui/badge";
// import homepageBackgroundImage from "@assets/homepage_background.png";
// import mealBoxCardImage from "@assets/mealBoxCard.svg";
// import bulkMealImage from "@assets/bulk_meal.svg";
// // TODO: Add the catering image file to attached_assets folder as catering_chef_indian.png
// // import cateringImage from "@assets/catering_chef_indian.png";
// // Corporate Order images
// // Note: File name is "coorporate.png" (with double 'o')
// import corporateImage1661 from "@assets/coorporate.png";
// import corporateImage1693 from "@assets/stock_images/image 1693.png";
// import corporateImage1696 from "@assets/coorporate.png";

// // Checker pattern - using CSS pattern if image doesn't exist
// // If you have the image, replace this with: import checkerPattern from "@assets/Group 2087328978_1763131515041.png";
// const checkerPattern = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

// const SERVICES = [
//   {
//     id: "mealbox",
//     title: "MealBox",
//     subtitle: "Custom-packed meals",
//     image: mealBoxCardImage,
//     bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
//   },
//   {
//     id: "bulk",
//     title: "Bulk Meal Delivery",
//     subtitle: "Order large portions",
//     image: bulkMealImage,
//     bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
//   },
//   {
//     id: "catering",
//     title: "Catering",
//     subtitle: "End-to-end service",
//     // TODO: Replace with: image: cateringImage, once the image file is added
//     image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
//     bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
//   },
//   {
//     id: "corporate",
//     title: "Corporate Order",
//     subtitle: "Customizations & more",
//     image: corporateImage1661, // Main composite image with man, cityscape, and text overlays
//     bgColor: "bg-gradient-to-br from-green-50 to-green-100",
//   },
// ];

// export default function HomePage() {
//   const [location, setLocation] = useLocation();

//   const currentTab =
//     location === "/" ? "home" : location === "/menu" ? "menu" : "profile";

//   // Only render bottom nav when we're actually on the home route
//   const showBottomNav = location === "/";

//   const handleServicePress = (serviceId: string) => {
//     switch (serviceId) {
//       case "mealbox":
//         setLocation("/mealbox");
//         break;
//       case "bulk":
//         setLocation("/catering");
//         break;
//       case "catering":
//         setLocation("/catering");
//         break;
//       case "corporate":
//         setLocation("/corporate");
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background pb-20">
//       {/* Header with Background Image */}
//       <div
//         className="relative overflow-hidden"
//         style={{
//           width: "100%",
//           height: "200px",
//           borderBottomLeftRadius: "50px",
//           borderBottomRightRadius: "50px",
//           backgroundImage: `url(${homepageBackgroundImage})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//         }}
//         data-testid="header-section"
//       >
//         {/* Checkered Pattern Overlay */}
//         <div
//           className="absolute inset-0 opacity-30"
//           style={{
//             backgroundImage: `url(${checkerPattern})`,
//             backgroundSize: "60px 60px",
//             backgroundRepeat: "repeat",
//           }}
//         />

//         {/* Header Content */}
//         <div className="relative z-10 h-full">
//           {/* Location */}
//           <div
//             className="absolute flex items-center"
//             style={{
//               width: "175px",
//               height: "34px",
//               top: "74px",
//               left: "15px",
//               gap: "4px",
//               paddingTop: "5px",
//               paddingRight: "10px",
//               paddingBottom: "5px",
//               paddingLeft: "10px",
//             }}
//             data-testid="container-location"
//           >
//             <MapPin className="w-5 h-5" style={{ color: "#000" }} />
//             <span
//               style={{
//                 color: "#000",
//                 fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                 fontWeight: 700,
//                 fontSize: "20px",
//                 lineHeight: "100%",
//                 letterSpacing: "-0.75px",
//                 textAlign: "center",
//               }}
//               data-testid="text-location"
//             >
//               Bengaluru, KA
//             </span>
//           </div>

//           {/* Cart Button */}
//           <div
//             className="absolute"
//             style={{
//               width: "40px",
//               height: "40px",
//               top: "69px",
//               left: "338px",
//             }}
//           >
//             <Button
//               size="icon"
//               className="rounded-full w-full h-full"
//               style={{ backgroundColor: "#1a4d2e", color: "#fff" }}
//               data-testid="button-cart"
//               onClick={() => setLocation("/checkout")}
//             >
//               <ShoppingCart className="w-5 h-5" />
//             </Button>
//           </div>

//           {/* Search Bar */}
//           <div
//             className="absolute bg-white flex items-center"
//             style={{
//               width: "363px",
//               height: "40px",
//               top: "129px",
//               left: "15px",
//               justifyContent: "space-between",
//               borderRadius: "5px",
//               borderWidth: "0.5px",
//               borderColor: "#e5e7eb",
//               borderStyle: "solid",
//               padding: "8px",
//             }}
//             data-testid="search-bar"
//           >
//             <div className="flex items-center gap-2 flex-1">
//               <Search className="w-4 h-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search"
//                 className="border-0 p-0 focus-visible:ring-0 text-sm flex-1"
//                 style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}
//                 data-testid="input-search"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <Mic className="w-4 h-4 text-muted-foreground" />
//               <Badge
//                 variant="outline"
//                 className="bg-white border-green-600 text-green-600 font-semibold px-2 text-xs"
//                 data-testid="badge-veg"
//               >
//                 VEG
//               </Badge>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Services Section */}
//       <div className="max-w-[393px] mx-auto px-4 pt-6 pb-20">
//         {/* Services We Offer Title */}
//         <h2
//           className="text-2xl font-bold mb-6"
//           style={{
//             fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//             color: "#000",
//           }}
//           data-testid="text-services-title"
//         >
//           Services We Offer
//         </h2>

//         {/* Service Cards Grid */}
//         <div className="space-y-4">
//           {/* Top Row - MealBox and Bulk Meal Delivery */}
//           <div className="flex gap-4">
//             {/* Left Column - MealBox and Catering stacked */}
//             <div className="flex flex-col gap-4">
//               {/* MealBox Card */}
//               <div
//                 style={{
//                   width: "175px",
//                   height: "145px",
//                   borderRadius: "15px",
//                   cursor: "pointer",
//                   overflow: "hidden",
//                 }}
//                 onClick={() => handleServicePress(SERVICES[0].id)}
//                 data-testid="card-service-mealbox"
//               >
//                 <img
//                   src={mealBoxCardImage}
//                   alt="MealBox"
//                   className="w-full h-full object-cover"
//                   style={{ borderRadius: "15px" }}
//                   data-testid="img-service-mealbox"
//                 />
//               </div>

//               {/* Catering Card - Directly below MealBox */}
//               <div
//                 style={{
//                   width: "175px",
//                   height: "145px",
//                   borderRadius: "15px",
//                   cursor: "pointer",
//                   overflow: "hidden",
//                   backgroundImage: `url(${SERVICES[2].image})`,
//                   backgroundSize: "cover",
//                   backgroundPosition: "center",
//                 }}
//                 onClick={() => handleServicePress(SERVICES[2].id)}
//                 data-testid="card-service-catering"
//               >
//                 <div className="w-full h-full bg-black bg-opacity-20 flex flex-col justify-between p-3">
//                   <div>
//                     <h3
//                       className="text-white font-bold text-lg"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                       }}
//                     >
//                       {SERVICES[2].title}
//                     </h3>
//                     <p
//                       className="text-white text-sm"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                       }}
//                     >
//                       {SERVICES[2].subtitle}
//                     </p>
//                   </div>
//                   <div
//                     className="w-8 h-8 rounded-full flex items-center justify-center"
//                     style={{ backgroundColor: "#1a4d2e" }}
//                   >
//                     <ArrowRight className="w-5 h-5 text-white" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Bulk Meal Delivery Card (tall, spans both rows) */}
//             <div
//               style={{
//                 width: "179px",
//                 height: "300px",
//                 borderRadius: "15px",
//                 borderWidth: "0.5px",
//                 borderStyle: "solid",
//                 borderColor: "#e5e7eb",
//                 cursor: "pointer",
//                 overflow: "hidden",
//               }}
//               onClick={() => handleServicePress(SERVICES[1].id)}
//               data-testid="card-service-bulk"
//             >
//               <img
//                 src={bulkMealImage}
//                 alt="Bulk Meal Delivery"
//                 className="w-full h-full object-cover"
//                 style={{ borderRadius: "15px" }}
//                 data-testid="img-service-bulk"
//               />
//             </div>
//           </div>

//           {/* Corporate Order Card - Full Image with Overlay Text */}
//           <div
//             className="relative mx-auto"
//             style={{
//               width: "364px",
//               height: "175px",
//               borderRadius: "15px",
//               cursor: "pointer",
//               overflow: "hidden",
//             }}
//             onClick={() => handleServicePress(SERVICES[3].id)}
//             data-testid="card-service-corporate-wide"
//           >
//             {/* Full Background Image - coorporate.png */}
//             <img
//               src={corporateImage1661}
//               alt="Corporate background"
//               style={{
//                 position: "absolute",
//                 top: 0,
//                 left: 0,
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "cover",
//                 objectPosition: "center",
//                 zIndex: 1,
//                 display: "block",
//               }}
//             />
            
//             {/* Overlay Image 1 - Text Graphic "CRISP & COPORATE-READY" (1693) */}
//             <img
//               src={corporateImage1693}
//               alt="Text graphic overlay"
//               style={{
//                 position: "absolute",
//                 top: 0,
//                 left: 0,
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "cover",
//                 objectPosition: "center",
//                 zIndex: 2,
//                 pointerEvents: "none",
//                 display: "block",
//               }}
//             />
            
//             {/* Overlay Image 2 - Man in Suit (1696) */}
//             <img
//               src={corporateImage1696}
//               alt="Man in suit"
//               style={{
//                 position: "absolute",
//                 top: 0,
//                 left: 0,
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "cover",
//                 objectPosition: "center",
//                 zIndex: 3,
//                 pointerEvents: "none",
//                 display: "block",
//               }}
//             />

//             {/* Overlay Text - Left Section Style */}
//             <div
//               className="absolute"
//               style={{
//                 top: "20px",
//                 left: "20px",
//                 zIndex: 4,
//                 width: "33%",
//               }}
//             >
//               {/* Corporate Order Title */}
//               <h3
//                 className="font-bold mb-2"
//                 style={{
//                   fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                   color: "#1a4d2e",
//                   fontSize: "12px",
//                   fontWeight: "bold",
//                   width: "87px",
//                   height: "14px",
//                   lineHeight: "14px",
//                 }}
//               >
//                 {SERVICES[3].title}
//               </h3>
//               {/* Customizations & more Subtitle */}
//               <p
//                 style={{
//                   fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                   color: "#000000",
//                   textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)",
//                   fontSize: "10px",
//                   fontWeight: "500",
//                   width: "100px",
//                   height: "14px",
//                   lineHeight: "14px",
//                 }}
//               >
//                 {SERVICES[3].subtitle}
//               </p>
//             </div>

//             {/* Arrow Button - Bottom Right */}
//             <div
//               className="absolute"
//               style={{
//                 bottom: "20px",
//                 right: "20px",
//                 zIndex: 4,
//               }}
//             >
//               <div
//                 className="w-10 h-10 rounded-full flex items-center justify-center"
//                 style={{ backgroundColor: "#1a4d2e" }}
//               >
//                 <ArrowRight className="w-5 h-5 text-white" />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
    

//       {/* Bottom Navigation - Only show on home route */}
//       {showBottomNav && location === "/" && (
//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border" style={{ zIndex: 50 }}>
//           <div className="max-w-[393px] mx-auto px-4 py-3 flex items-center justify-around">
//             <Button
//               variant={currentTab === "home" ? "default" : "ghost"}
//               className={`flex items-center gap-2 ${
//                 currentTab === "home"
//                   ? "bg-green-700 hover:bg-green-800 text-white"
//                   : "text-muted-foreground"
//               }`}
//               onClick={() => setLocation("/")}
//               data-testid="button-nav-home"
//             >
//               <HomeIcon className="w-5 h-5" />
//               <span className="font-medium" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>Home</span>
//             </Button>
//             <Button
//               variant={currentTab === "menu" ? "default" : "ghost"}
//               className={`flex items-center gap-2 ${
//                 currentTab === "menu"
//                   ? "bg-green-700 hover:bg-green-800 text-white"
//                   : "text-muted-foreground"
//               }`}
//               onClick={() => setLocation("/categories/tiffins")}
//               data-testid="button-nav-menu"
//             >
//               <MenuIcon className="w-5 h-5" />
//               <span className="font-medium" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>Menu</span>
//             </Button>
//             <Button
//               variant={currentTab === "profile" ? "default" : "ghost"}
//               className={`flex items-center gap-2 ${
//                 currentTab === "profile"
//                   ? "bg-green-700 hover:bg-green-800 text-white"
//                   : "text-muted-foreground"
//               }`}
//               onClick={() => setLocation("/profile")}
//               data-testid="button-nav-profile"
//             >
//               <User className="w-5 h-5" />
//               <span className="font-medium" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>Profile</span>
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import { useState } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/pages/AppHeader";
import HeroSection from "@/pages/HeroSection";
import ServicesWeOfferSection from "@/pages/ServicesWeOfferSection";
import SpotlightFeaturesSection from "@/pages/SpotlightSection";
import SmartMenuConciergeSection from "@/pages/SmartMenuSection";
import FloatingNav from "@/pages/FloatingNav";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const { toast } = useToast();

  const handleLocationClick = () => {
    console.log("Location selector clicked");
    toast({
      title: "Change Location",
      description: "Location selection coming soon!",
    });
  };

  const handleCartClick = () => {
    console.log("Cart clicked");
    toast({
      title: "Cart",
      description: `You have ${cartCount} item${cartCount !== 1 ? 's' : ''} in your cart`,
    });
  };

  const handleExploreMenu = () => {
    console.log("Explore Menu clicked");
    setActiveTab("menu");
    toast({
      title: "Menu",
      description: "Menu page coming soon!",
    });
  };

  const handleServiceClick = (serviceId: string) => {
    console.log(`Service clicked: ${serviceId}`);
    
    if (serviceId === "corporate") {
      setLocation("/corporate");
    } else if (serviceId === "catering") {
      setLocation("/catering");
    } else if (serviceId === "mealbox") {
      setLocation("/mealbox");
    } else if (serviceId === "bulk") {
      // Redirect to categories page for bulk meals
      setLocation("/categories/lunch-dinner");
    } else {
      toast({
        title: "Service Selected",
        description: `Opening ${serviceId} page...`,
      });
    }
  };

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    console.log(`Tab changed to: ${tab}`);
    setActiveTab(tab);
    
    if (tab === "menu") {
      setLocation("/meal-box");
    } else if (tab === "profile") {
      toast({
        title: "Profile Page",
        description: "Profile page coming soon!",
      });
    }
  };

  const handleTryMenuConcierge = () => {
    console.log("Smart Menu Concierge clicked");
    toast({
      title: "Smart Menu Concierge",
      description: "AI-powered menu creation coming soon!",
    });
  };

  return (
    <div className="min-h-screen pb-24">
      <AppHeader 
        cartCount={cartCount}
        onLocationClick={handleLocationClick}
        onCartClick={handleCartClick}
      />
      
      <HeroSection onExploreMenu={handleExploreMenu} />
      <ServicesWeOfferSection onServiceClick={handleServiceClick} />
      
      <div className="mt-4">
        <SpotlightFeaturesSection />
      </div>

      <div className="mt-6">
        <SmartMenuConciergeSection onTryNow={handleTryMenuConcierge} />
      </div>
    
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}