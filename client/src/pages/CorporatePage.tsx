// import { useState, useEffect } from 'react';
// import { useLocation } from 'wouter';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Carousel, CarouselContent, CarouselItem as CarouselItemComponent, type CarouselApi } from '@/components/ui/carousel';
// import { useToast } from '@/hooks/use-toast';
// import AppHeader from '@/components/AppHeader';
// import BottomNav from '@/components/BottomNav';
// import { apiRequest } from '@/lib/queryClient';
// import { getApiUrl } from '@/config/api';
// import { 
//   Building2, 
//   Users, 
//   Calendar, 
//   Truck, 
//   Sparkles, 
//   Camera,
//   CheckCircle,
//   Clock,
//   Phone,
//   Mail,
//   MapPin,
//   ArrowLeft,
//   Search,
//   Mic,
//   ShoppingCart
// } from 'lucide-react';
// import corporateBackground from '@assets/CorporateBackground.png';
// import mealBoxImage4 from '@assets/Catering (5).png';
// import mealBoxImage2 from '@assets/MealBox (4).png';
// import cateringImage5 from '@assets/MealBox (2).png';
// import cateringImage7 from '@assets/Catering (7).png';
// import toggleImage from '@assets/Toggle.png';
// import micIcon from '@assets/lets-icons_mic-fill.png';
// import searchIcon from '@assets/lucide_search.png';
// import cartIcon from '@assets/Cart (1).png';
// import corporateManImage from '@assets/image 1661 (1).png';
// import bulkOrderImage from '@assets/stock_images/Bulk Order.png';
// import deliveryImage from '@assets/Delivery.png';
// import priorityServiceImage from '@assets/stock_images/Priority Service.png';
// import eventDecorImage from '@assets/stock_images/Event Decor.png';
// import photographyImage from '@assets/stock_images/Photography.png';
// import menuImage from '@assets/stock_images/Menu (1).png';
// import eventDecorIcon from '@assets/streamline-ultimate_party-decoration-bold.png';
// import photographyIcon from '@assets/mdi_camera.png';
// import customMenuIcon from '@assets/ep_menu.png';

// interface CarouselItem {
//   id: string;
//   title: string;
//   description: string;
//   image: string;
// }

// interface CorporateData {
//   carouselItems: CarouselItem[];
//   success: boolean;
// }

// export default function CorporatePage(): JSX.Element {
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const [activeTab, setActiveTab] = useState('home');
//   const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [api, setApi] = useState<CarouselApi>();
//   const [current, setCurrent] = useState(0);

//   const [formData, setFormData] = useState({
//     companyName: '',
//     contactPerson: '',
//     email: '',
//     phone: '',
//     numberOfPeople: '',
//     vegCount: '',
//     nonVegCount: '',
//     eggCount: '',
//     totalPeople: '',
//     eventType: '',
//     budgetMin: '',
//     budgetMax: '',
//     eventDate: '',
//     eventTime: '',
//     additionalServices: [] as string[],
//     message: ''
//   });

//   // Fetch corporate data from API
//   useEffect(() => {
//     const fetchCorporateData = async () => {
//       try {
//         setLoading(true);
//         const response = await apiRequest('GET', '/api/corporate');
//         const data: CorporateData = await response.json();
        
//         if (data.success && data.carouselItems) {
//           setCarouselItems(data.carouselItems);
//           console.log('Corporate data loaded:', data.carouselItems);
//         }
//       } catch (error) {
//         console.error('Error fetching corporate data:', error);
//         toast({
//           title: "Error",
//           description: "Failed to load corporate data. Please try again later.",
//           variant: "destructive"
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCorporateData();
//   }, [toast]);

//   // Track carousel slide changes
//   useEffect(() => {
//     if (!api) {
//       return;
//     }

//     setCurrent(api.selectedScrollSnap());

//     api.on("select", () => {
//       setCurrent(api.selectedScrollSnap());
//     });
//   }, [api]);

//   const handleTabChange = (tab: string) => {
//     setActiveTab(tab);
//     if (tab === 'home') {
//       setLocation('/');
//     } else if (tab === 'orders') {
//       setLocation('/orders');
//     } else if (tab === 'profile') {
//       setLocation('/profile');
//     }
//   };

//   const handleServiceToggle = (service: string) => {
//     setFormData(prev => ({
//       ...prev,
//       additionalServices: prev.additionalServices.includes(service)
//         ? prev.additionalServices.filter(s => s !== service)
//         : [...prev.additionalServices, service]
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Validation
//     if (!formData.eventType) {
//       toast({
//         title: "Missing Information",
//         description: "Please enter an event type.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     if (!formData.eventDate) {
//       toast({
//         title: "Missing Information",
//         description: "Please select an event date.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     if (!formData.contactPerson || !formData.phone) {
//     toast({
//         title: "Missing Information",
//         description: "Please fill in all required contact fields.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     try {
//       // Calculate individual counts (allow empty/0 values)
//       const vegCount = parseInt(formData.vegCount) || 0;
//       const nonVegCount = parseInt(formData.nonVegCount) || 0;
//       const eggCount = parseInt(formData.eggCount) || 0;
      
//       // Calculate total people - use totalPeople if provided, otherwise sum individual counts
//       let guestCount = parseInt(formData.totalPeople) || 0;
//       if (guestCount === 0) {
//         // If totalPeople is not provided, calculate from individual counts
//         guestCount = vegCount + nonVegCount + eggCount;
//       }
      
//       // If still 0, set a minimum of 1 (required field in DB)
//       if (guestCount === 0) {
//         guestCount = 1;
//       }

//       // Build dietary_types array based on counts (only include types with count > 0)
//       const dietaryTypes: string[] = [];
//       if (vegCount > 0) {
//         dietaryTypes.push('veg');
//       }
//       if (nonVegCount > 0) {
//         dietaryTypes.push('non-veg');
//       }
//       if (eggCount > 0) {
//         dietaryTypes.push('egg');
//       }
      
//       // If no dietary types specified, default to empty array (or you can default to ['veg'])
//       // The database requires this field, so we'll use empty array if none specified
//       // You may want to adjust this based on your business logic

//       // Map additional services to add_on_ids
//       // Since we don't have actual add-on IDs, we'll use the service names as IDs
//       // You may need to adjust this based on your actual add-ons table
//       const addOnIds = formData.additionalServices.map(service => {
//         // Map service names to potential add-on IDs
//         const serviceMap: Record<string, string> = {
//           'decor': 'event-decor',
//           'photography': 'photography',
//           'custom-menu': 'custom-menu'
//         };
//         return serviceMap[service] || service;
//       });

//       // Prepare data for API - matching database schema exactly
//       const cateringOrderData = {
//         event_type: formData.eventType,
//         guest_count: guestCount,
//         event_date: formData.eventDate, // Stored as text
//         meal_times: [] as string[], // Required field - empty array if not specified
//         dietary_types: dietaryTypes.length > 0 ? dietaryTypes : [], // Empty array if none specified
//         cuisines: [] as string[], // Required field - empty array if not specified
//         add_on_ids: addOnIds.length > 0 ? addOnIds : null, // text[] null in DB
//         name: formData.companyName || formData.contactPerson, // Use company name or email as name
//         email: formData.contactPerson, // Company Email Address is stored in contactPerson
//         phone: formData.phone,
//         message: formData.message || null, // text null in DB
//         status: 'pending'
//       };

//       console.log('[Catering Order] Submitting data:', cateringOrderData);
//       console.log('[Catering Order] API URL will be:', getApiUrl('/api/catering-orders'));

//       // Submit via API endpoint (uses service role key to bypass RLS)
//       const response = await apiRequest('POST', '/api/catering-orders', cateringOrderData);
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
//         throw new Error(errorData.error || 'Failed to submit catering order');
//       }
//       const result = await response.json();
      
//       // Navigate to thank you page
//       setLocation('/catering-thank-you');
//     } catch (error) {
//       console.error('Error submitting catering order:', error);
//       toast({
//         title: "Error",
//         description: "Failed to submit your request. Please try again.",
//         variant: "destructive"
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen pb-20 relative" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
//       {/* Blue Geometric Background */}
//       <div
//         className="absolute -z-10"
//         style={{
//           backgroundImage: `url(${corporateBackground})`,
//           backgroundSize: "100% auto",
//           backgroundPosition: "center top",
//           backgroundRepeat: "repeat-x",
//           top: 0,
//           left: 0,
//           right: 0,
//           width: "100%",
//           minHeight: "300px",
//         }}
//       />

//       {/* Top Section with Location */}
//       <div className="relative z-10 pt-4 px-4">
//         {/* Back Button */}
//         <Button 
//           variant="ghost" 
//           size="sm" 
//           className="mb-4 text-white hover:text-white hover:bg-white/20"
//           onClick={() => setLocation('/')}
//           data-testid="button-back"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           Back
//         </Button>

//         {/* Location Display */}
//         <div className="flex items-center gap-2 mb-6">
//           <MapPin className="w-5 h-5 text-white" />
//           <span className="text-white font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
//             Bengaluru, KA
//           </span>
//           <div className="ml-auto">
//             <button
//               className="rounded-full bg-white/20 hover:bg-white/30 p-0 border-0 cursor-pointer flex items-center justify-center"
//               onClick={() => setLocation("/checkout")}
//               style={{
//                 width: "auto",
//                 height: "auto",
//                 background: "transparent"
//               }}
//             >
//               <img
//                 src={cartIcon}
//                 alt="Shopping Cart"
//                 style={{
//                   width: "50px",
//                   height: "50px",
//                   objectFit: "contain"
//                 }}
//               />
//             </button>
//           </div>
//         </div>

//         {/* Service Cards - Single Row */}
//         <div className="flex mb-1 justify-center" style={{ maxWidth: "100%", padding: "0 16px", gap: "8px", overflow: "hidden" }}>
//           {/* Bulk Meals Card */}
//           <div
//             className="cursor-pointer flex-shrink-0"
//             onClick={() => setLocation('/catering')}
//             style={{
//               width: "calc((100% - 24px) / 4)",
//               maxWidth: "100px",
//               height: "100px",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={cateringImage5}
//               alt="Bulk Meals"
//               style={{
//                 width: "100px",
//                 height: "100px",
//                 objectFit: "contain",
//                 marginBottom: "4px"
//               }}
//             />
//             <span className="text-xs font-semibold text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif", color: "#1a4d2e" }}>
//               {/* Bulk Meals */}
//             </span>
//           </div>

//           {/* MealBox Card */}
//           <div
//             className="cursor-pointer flex-shrink-0"
//             onClick={() => setLocation('/mealbox')}
//             style={{
//               width: "calc((100% - 24px) / 4)",
//               maxWidth: "100px",
//               height: "100px",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={mealBoxImage2}
//               alt="MealBox"
//               style={{
//                 width: "100px",
//                 height: "100px",
//                 objectFit: "contain",
//                 marginBottom: "4px"
//               }}
//             />
//             <span className="text-xs font-semibold text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif", color: "#1a4d2e" }}>
            
//             </span>
//           </div>

//           {/* Catering Card */}
//           <div
//             className="cursor-pointer flex-shrink-0"
//             onClick={() => setLocation('/catering')}
//             style={{
//               width: "calc((100% - 24px) / 4)",
//               maxWidth: "100px",
//               height: "100px",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={mealBoxImage4}
//               alt="Catering"
//               style={{
//                 width: "100px",
//                 height: "100px", 
//                 objectFit: "contain",
//                 marginBottom: "6px"
//               }}
//             />  
//             <span className="text-xs font-semibold text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif", color: "#1a4d2e" }}>
              
//             </span>
//           </div>

//           {/* Corporate Card - Dark Green */}
//           <div
//             className="cursor-pointer flex-shrink-0"            
//             onClick={() => setLocation('/corporate')}
//             style={{
//               width: "calc((100% - 24px) / 4)",
//               maxWidth: "100px",
//               height: "100px",
//               display: "flex",  
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={cateringImage7}
//               alt="Corporate"
//               style={{
//                 width: "100px",
//                 height: "100px",
//                 objectFit: "contain",
//                 marginBottom: "4px"
//               }}
//             />
//             <span className="text-xs font-semibold text-white text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
               
//             </span>
//           </div>
//             </div>


//         {/* Corporate Catering Section - Without Card */}
//         <div className="relative z-10 px-4 mb-0 max-w-[400px] mx-auto" style={{ marginTop: "8px", marginBottom: "-20px" }}>
//           <div className="flex flex-row items-center justify-between gap-4">
//             <div className="flex-1">
//               <h2 
//                 className="font-bold mb-2 whitespace-nowrap" 
//                 style={{ 
//                   color: "#1a4d2e", 
//                   fontFamily: "Sweet Sans Pro, -apple-system, sans-serif", 
//                   fontSize: "24px",
//                   lineHeight: "1.2" 
//                 }}
//               >
//                 Corporate Catering
//               </h2>
//               <p 
//                 className="text-gray-900 leading-relaxed" 
//                 style={{ 
//                   fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                   fontSize: "12px",
//                   fontWeight: "500",
//                   lineHeight: "1.4"
//                 }}
//               >
//                 Elevate your workspace experience<br />
//                 with authentic Indian Cuisine
//               </p>
//             </div>
//             <div className="flex-shrink-0" style={{ width: "153px", height: "173.86px" }}>
//               <img
//                 src={corporateManImage}
//                 alt="Corporate Catering"
//                 className="w-full h-full object-contain"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Carousel Section - All Cards */}
//         <div className="relative z-20 mb-6 max-w-full mx-auto" style={{ marginTop: "-20px" }}>
//           <Carousel
//             setApi={setApi}
//             opts={{
//               align: "start",
//               loop: false,
//             }}
//             className="w-full"
//           >
//             <CarouselContent className="-ml-0">
//               {[
//                 { id: 'bulk-order', image: bulkOrderImage },
//                 { id: 'delivery', image: deliveryImage },
//                 { id: 'priority-service', image: priorityServiceImage },
//                 { id: 'event-decor', image: eventDecorImage },
//                 { id: 'photography', image: photographyImage },
//                 { id: 'menu', image: menuImage },
//               ].map((item, index) => (
//                 <CarouselItemComponent 
//                   key={item.id} 
//                   className="pl-0 basis-full"
//                 >
//                   <div
//                     style={{
//                       width: "100%",
//                       height: "150px",
//                       borderRadius: "15px",
//                       overflow: "hidden",
//                       cursor: "pointer",
//                     }}
//                   >
//                     <img
//                       src={item.image}
//                       alt={item.id}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                 </CarouselItemComponent>
//               ))}
//             </CarouselContent>
//           </Carousel>
          
//           {/* Carousel Indicators */}
//           <div className="flex justify-center gap-2 mt-4 px-4">
//             {[
//               { id: 'bulk-order', image: bulkOrderImage },
//               { id: 'delivery', image: deliveryImage },
//               { id: 'priority-service', image: priorityServiceImage },
//               { id: 'event-decor', image: eventDecorImage },
//               { id: 'photography', image: photographyImage },
//               { id: 'menu', image: menuImage },
//             ].map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => api?.scrollTo(index)}
//                 className={`transition-all duration-200 rounded-full ${
//                   current === index
//                     ? 'bg-gray-800 w-2 h-2'
//                     : 'bg-gray-300 w-2 h-2'
//                 }`}
//                 aria-label={`Go to slide ${index + 1}`}
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">

//         {/* Benefits Grid */}
//         {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
//           <Card className="hover-elevate" data-testid="card-bulk-orders">
//             <CardHeader className="pb-3">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
//                 <Users className="w-6 h-6 text-primary" />
//               </div>
//               <CardTitle className="text-lg">Bulk Order Discounts</CardTitle>
//               <CardDescription>
//                 Special pricing for large orders. The more you order, the more you save.
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card className="hover-elevate" data-testid="card-scheduled-delivery">
//             <CardHeader className="pb-3">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
//                 <Calendar className="w-6 h-6 text-primary" />
//               </div>
//               <CardTitle className="text-lg">Scheduled Delivery</CardTitle>
//               <CardDescription>
//                 Plan your meals in advance with our flexible scheduling options.
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card className="hover-elevate" data-testid="card-dedicated-support">
//             <CardHeader className="pb-3">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
//                 <Truck className="w-6 h-6 text-primary" />
//               </div>
//               <CardTitle className="text-lg">Priority Service</CardTitle>
//               <CardDescription>
//                 Dedicated account manager and priority delivery for your orders.
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card className="hover-elevate" data-testid="card-event-decor">
//             <CardHeader className="pb-3">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
//                 <Sparkles className="w-6 h-6 text-primary" />
//               </div>
//               <CardTitle className="text-lg">Event Decoration</CardTitle>
//               <CardDescription>
//                 Beautiful, professional decor to make your events memorable.
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card className="hover-elevate" data-testid="card-photography">
//             <CardHeader className="pb-3">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
//                 <Camera className="w-6 h-6 text-primary" />
//               </div>
//               <CardTitle className="text-lg">Photography Services</CardTitle>
//               <CardDescription>
//                 Professional photography to capture your special moments.
//               </CardDescription>
//             </CardHeader>
//           </Card>

//           <Card className="hover-elevate" data-testid="card-custom-menu">
//             <CardHeader className="pb-3">
//               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
//                 <CheckCircle className="w-6 h-6 text-primary" />
//               </div>
//               <CardTitle className="text-lg">Customized Menus</CardTitle>
//               <CardDescription>
//                 Tailored menu options to match your event requirements and budget.
//               </CardDescription>
//             </CardHeader>
//           </Card>
//         </div> */}

//         {/* Quote Request Form */}
//         <Card className="mb-8" data-testid="card-quote-form">
//           <CardHeader>
//             <CardTitle className="text-2xl">Request a Quote</CardTitle>
//             <CardDescription>
//               Fill out the form below and our team will get<br />
//               back to you within 24 hours
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="companyName">Company Name *</Label>
//                   <Input
//                     id="companyName"
//                     data-testid="input-company-name"
//                     required
//                     value={formData.companyName}
//                     onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
//                     placeholder="Enter Your company name"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="contactPerson">Company Email Address *</Label>
//                   <Input
//                     id="contactPerson"
//                     data-testid="input-contact-person"
//                     required
//                     value={formData.contactPerson}
//                     onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
//                     placeholder="your.email@company.com"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="phone">Phone Number *</Label>
//                   <Input
//                     id="phone"
//                     type="tel"
//                     data-testid="input-phone"
//                     required
//                     value={formData.phone}
//                     onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                     placeholder="+91 98765 43210"
//                   />
//                 </div>
//               </div>

//               {/* Number of People & Dietary Preferences */}
//               <div className="space-y-4">
//                 <Label className="text-base font-semibold">Number of People & Dietary Preferences</Label>
                
//                 {/* VEG Row */}
//                 <div className="flex items-center gap-3">
//                   <Input
//                     id="vegCount"
//                     type="number"
//                     data-testid="input-veg-count"
//                     value={formData.vegCount}
//                     onChange={(e) => setFormData({ ...formData, vegCount: e.target.value })}
//                     placeholder="00"
//                     className="w-16 h-10"
//                     style={{ textAlign: "center" }}
//                   />
//                   <div
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg border"
//                     style={{
//                       borderColor: "#1a4d2e",
//                       backgroundColor: "transparent",
//                       cursor: "pointer",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "8px",
//                         height: "8px",
//                         borderRadius: "50%",
//                         backgroundColor: "#1a4d2e"
//                       }}
//                     />
//                     <span
//                       className="text-sm font-semibold"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#1a4d2e"
//                       }}
//                     >
//                       VEG
//                     </span>
//                   </div>
//                 </div>

//                 {/* NON-VEG Row */}
//                 <div className="flex items-center gap-3">
//                   <Input
//                     id="nonVegCount"
//                     type="number"
//                     data-testid="input-non-veg-count"
//                     value={formData.nonVegCount}
//                     onChange={(e) => setFormData({ ...formData, nonVegCount: e.target.value })}
//                     placeholder="00"
//                     className="w-16 h-10"
//                     style={{ textAlign: "center" }}
//                   />
//                   <div
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg border"
//                     style={{
//                       borderColor: "#dc2626",
//                       backgroundColor: "transparent",
//                       cursor: "pointer",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "8px",
//                         height: "8px",
//                         borderRadius: "50%",
//                         backgroundColor: "#dc2626"
//                       }}
//                     />
//                     <span
//                       className="text-sm font-semibold"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#000000"
//                       }}
//                     >
//                       NON-VEG
//                     </span>
//                   </div>
//                 </div>

//                 {/* EGG Row */}
//                 <div className="flex items-center gap-3">
//                   <Input
//                     id="eggCount"
//                     type="number"
//                     data-testid="input-egg-count"
//                     value={formData.eggCount}
//                     onChange={(e) => setFormData({ ...formData, eggCount: e.target.value })}
//                     placeholder="00"
//                     className="w-16 h-10"
//                     style={{ textAlign: "center" }}
//                   />
//                   <div
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg border"
//                     style={{
//                       borderColor: "#b45309",
//                       backgroundColor: "transparent",
//                       cursor: "pointer",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "8px",
//                         height: "8px",
//                         borderRadius: "50%",
//                         backgroundColor: "#b45309"
//                       }}
//                     />
//                     <span
//                       className="text-sm font-semibold"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#000000"
//                       }}
//                     >
//                       EGG
//                     </span>
//                   </div>
//                 </div>

//                 {/* Total People Row */}
//                 <div className="flex items-center gap-3">
//                   <Input
//                     id="totalPeople"
//                     type="number"
//                     data-testid="input-total-people"
//                     required
//                     min="10"
//                     value={formData.totalPeople}
//                     onChange={(e) => setFormData({ ...formData, totalPeople: e.target.value })}
//                     placeholder="00"
//                     className="w-16 h-10"
//                     style={{ textAlign: "center" }}
//                   />
//                   <div
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg border"
//                     style={{
//                       borderColor: "#e5e7eb",
//                       backgroundColor: "transparent",
//                     }}
//                   >
//                     <span
//                       className="text-sm font-semibold"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#000000"
//                       }}
//                     >
//                       Total People
//                     </span>
//                   </div>
//                 </div>
//                 </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="eventType">Event Type *</Label>
//                   <Input
//                     id="eventType"
//                     type="text"
//                     data-testid="input-event-type"
//                     required
//                     value={formData.eventType}
//                     onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
//                     placeholder="Example: shareholder meeting, business meeting.."
//                   />
//                 </div>
//               </div>

//               {/* Budget per person */}
//               <div className="space-y-2">
//                 <Label className="text-base font-semibold">Budget per person (INR)</Label>
//                 <div className="flex items-center gap-3">
//                   <Input
//                     id="budgetMin"
//                     type="number"
//                     data-testid="input-budget-min"
//                     value={formData.budgetMin}
//                     onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
//                     placeholder="Min"
//                     style={{ width: "120px" }}
//                   />
//                   <Input
//                     id="budgetMax"
//                     type="number"
//                     data-testid="input-budget-max"
//                     value={formData.budgetMax}
//                     onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
//                     placeholder="Max"
//                     style={{ width: "120px" }}
//                   />
//                 </div>
//               </div>

//               {/* Select Event Date & Time */}
//               <div className="space-y-2">
//                 <Label className="text-base font-semibold">Select Event Date & Time</Label>
//                 <div className="flex items-center gap-3">
//                   <div className="relative flex-1">
//                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//                 <Input
//                   id="eventDate"
//                   type="date"
//                   data-testid="input-event-date"
//                   required
//                   value={formData.eventDate}
//                   onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
//                   min={new Date().toISOString().split('T')[0]}
//                       className="pl-10"
//                       placeholder="10/05/2025"
//                     />
//                   </div>
//                   <div className="relative" style={{ width: "120px" }}>
//                     <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//                     <Input
//                       id="eventTime"
//                       type="time"
//                       data-testid="input-event-time"
//                       value={formData.eventTime}
//                       onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
//                       className="pl-10"
//                       placeholder="12:00"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <Label>Additional Services (Optional)</Label>
//                 <div className="space-y-3">
//                   {/* Event Decor */}
//                   <div
//                     className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                     style={{ borderColor: "#e5e7eb" }}
//                     onClick={() => handleServiceToggle('decor')}
//                     data-testid="button-service-decor"
//                   >
//                     <Checkbox
//                       checked={formData.additionalServices.includes('decor')}
//                     />
//                     <img
//                       src={eventDecorIcon}
//                       alt="Event Decor"
//                       className="w-5 h-5"
//                     />
//                     <span
//                       className="text-sm font-medium"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#000000"
//                       }}
//                     >
//                     Event Decor
//                     </span>
//                   </div>

//                   {/* Photography */}
//                   <div
//                     className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                     style={{ borderColor: "#e5e7eb" }}
//                     onClick={() => handleServiceToggle('photography')}
//                     data-testid="button-service-photography"
//                   >
//                     <Checkbox
//                       checked={formData.additionalServices.includes('photography')}
//                     />
//                     <img
//                       src={photographyIcon}
//                       alt="Photography"
//                       className="w-5 h-5"
//                     />
//                     <span
//                       className="text-sm font-medium"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#000000"
//                       }}
//                     >
//                     Photography
//                     </span>
//                   </div>

//                   {/* Custom Menu */}
//                   <div
//                     className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                     style={{ borderColor: "#e5e7eb" }}
//                     onClick={() => handleServiceToggle('custom-menu')}
//                     data-testid="button-service-custom-menu"
//                   >
//                     <Checkbox
//                       checked={formData.additionalServices.includes('custom-menu')}
//                     />
//                     <img
//                       src={customMenuIcon}
//                       alt="Custom Menu"
//                       className="w-5 h-5"
//                     />
//                     <span
//                       className="text-sm font-medium"
//                       style={{
//                         fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                         color: "#000000"
//                       }}
//                     >
//                     Custom Menu
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                   <Label htmlFor="message">Additional Requests (if any)</Label>
//                 <Textarea
//                   id="message"
//                   data-testid="textarea-message"
//                   value={formData.message}
//                   onChange={(e) => setFormData({ ...formData, message: e.target.value })}
//                     placeholder="Please add any additional requests here"
//                     style={{
//                       fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                       fontSize: "16px",
//                       fontWeight: "560",
//                       color: "#B6B6B6",
//                     }}
//                     className="placeholder:text-[#B6B6B6]"
//                 />
//               </div>

//               <Button 
//                 type="submit" 
//                 size="lg" 
//                 className="w-full"
//                 data-testid="button-submit-quote"
//                 style={{
//                   backgroundColor: "#1A9952",
//                   color: "#FFFFFF",
//                 }}
//               >
//                 SEND ENQUIRY
//               </Button>
//             </form>
//           </CardContent>
//         </Card>

//         {/* Contact Information */}
//         {/* <Card data-testid="card-contact-info">
//           <CardHeader>
//             <CardTitle>Need Immediate Assistance?</CardTitle>
//             <CardDescription>Our corporate catering team is here to help</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                 <Phone className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <p className="font-medium">Phone</p>
//                 <p className="text-sm text-muted-foreground">+91 80 1234 5678</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                 <Mail className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <p className="font-medium">Email</p>
//                 <p className="text-sm text-muted-foreground">corporate@feastexpress.com</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                 <Clock className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <p className="font-medium">Business Hours</p>
//                 <p className="text-sm text-muted-foreground">Monday - Saturday: 9:00 AM - 8:00 PM</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                 <MapPin className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <p className="font-medium">Location</p>
//                 <p className="text-sm text-muted-foreground">Bangalore, Karnataka</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card> */}
//       </div>

//       <BottomNav 
//         activeTab={activeTab}
//         onTabChange={handleTabChange}
//         cartItemCount={0}
//       />
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { corporateOrderService } from "@/lib/supabase-service";
import { ArrowLeft, Building2, Users, Calendar, Mail, Phone, MapPin, ShoppingCart, UtensilsCrossed, Package, Truck, Clock } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import ContinueOrderBanner from "@/pages/ContinueOrderBanner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import corporateHeroPattern from "@assets/CorporateBackground.png";
import corporateManImage from "@assets/image 1661 (1).png";
import customizedMenuImg from "@assets/Menu (2).png"; 
import photographyImg from "@assets/Photography (2).png";
import eventDecorImg from "@assets/Event Decor (2).png";
import bulkOrderImg from "@assets/Bulk Order (1).png";
import deliveryImg from "@assets/Delivery (1).png";
import priorityServiceImg from "@assets/Priority Service (1).png";

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate";

export default function CorporateOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const [selectedService, setSelectedService] = useState<ServiceType>("corporate");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    veg: "",
    nonVeg: "",
    egg: "",
    numberOfPeople: "",
    eventType: "",
    budgetMin: "",
    budgetMax: "",
    eventDate: "",
    eventTime: "",
    message: "",
  });

  // Calculate total people from dietary preferences
  const totalPeople = (parseInt(formData.veg) || 0) + (parseInt(formData.nonVeg) || 0) + (parseInt(formData.egg) || 0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactPerson || !formData.phone || !formData.eventDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create corporate order
      await corporateOrderService.create({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email || undefined,
        phone: formData.phone,
        numberOfPeople: parseInt(formData.numberOfPeople) || totalPeople,
        vegCount: parseInt(formData.veg) || 0,
        nonVegCount: parseInt(formData.nonVeg) || 0,
        eggCount: parseInt(formData.egg) || 0,
        eventType: formData.eventType,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime || undefined,
        additionalServices: undefined, // Not in form
        message: formData.message || undefined,
        addressId: undefined, // Not in form
      });
      
      toast({
        title: "Order Created!",
        description: "Your corporate order has been submitted successfully.",
      });
      
      setLocation("/corporate-thank-you");
    } catch (error: any) {
      console.error("Error creating corporate order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to submit corporate order. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Blue Geometric Background Header */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          backgroundImage: `url(${corporateHeroPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          height: "300px",
        }}
      />

      {/* Header Section with Location and Cart */}
      <div className="relative z-10 px-4 pt-4 pb-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-white hover:text-white hover:bg-white/20"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Location and Cart */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro" }}>
              Bengaluru, KA
            </span>
          </div>
          <button
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => toast({ title: "Cart", description: "Cart coming soon!" })}
            data-testid="button-cart"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Service Navigation Tabs */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setLocation("/bulk-meals")}
            data-testid="service-tab-bulk-meals"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: selectedService === "bulk-meals" ? "#06352A" : "#FFFFFF",
              color: selectedService === "bulk-meals" ? "#F5E9DB" : "#06352A",
            }}
          >
            <UtensilsCrossed className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Bulk Meals
            </span>
          </button>

          <button
            onClick={() => setLocation("/mealbox")}
            data-testid="service-tab-mealbox"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: selectedService === "mealbox" ? "#06352A" : "#FFFFFF",
              color: selectedService === "mealbox" ? "#F5E9DB" : "#06352A",
            }}
          >
            <Package className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              MealBox
            </span>
          </button>

          <button
            onClick={() => setLocation("/catering")}
            data-testid="service-tab-catering"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: selectedService === "catering" ? "#06352A" : "#FFFFFF",
              color: selectedService === "catering" ? "#F5E9DB" : "#06352A",
            }}
          >
            <Truck className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Catering
            </span>
          </button>

          <button
            onClick={() => setSelectedService("corporate")}
            data-testid="service-tab-corporate"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: selectedService === "corporate" ? "#06352A" : "#FFFFFF",
              color: selectedService === "corporate" ? "#F5E9DB" : "#06352A",
            }}
          >
            <Building2 className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Corporate
            </span>
          </button>
        </div>
      </div>

      {/* Content below blue background */}
      <div className="relative z-10 px-4" style={{ marginTop: "0px", paddingTop: "16px" }}>

        {/* Corporate Catering Header Section with Background Image */}
        <div 
          className="relative mb-8 overflow-hidden"
          style={{
            borderRadius: "10px",
            background: "transparent",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 py-6 pl-4 pr-4 z-10">
              <h1
                className="text-[#06352A] mb-2 whitespace-nowrap"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  fontSize: "24px",
                  fontWeight: 700,
                  textAlign: "left",
                }}
              >
                Corporate Catering
              </h1>
              <p
                className="text-gray-700"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  fontSize: "13px",
                  fontWeight: 400,
                  textAlign: "left",
                }}
              >
                For your every need, we are there at every step
              </p>
            </div>
            <div className="flex-shrink-0 relative" style={{ width: "160px", height: "160px" }}>
              <img
                src={corporateManImage}
                alt="Corporate Professional"
                className="absolute bottom-0 h-full w-auto object-contain"
                style={{ right: "20px" }}
              />
            </div>
          </div>
        </div>

        {/* Services Carousel */}
        <div className="mb-8">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            setApi={setCarouselApi}
          >
            <CarouselContent>
              <CarouselItem data-testid="carousel-item-customized-menu">
                <img
                  src={customizedMenuImg}
                  alt="Customized Menu"
                  className="w-full h-auto rounded-md"
                />
              </CarouselItem>
              <CarouselItem data-testid="carousel-item-photography">
                <img
                  src={photographyImg}
                  alt="Photography Services"
                  className="w-full h-auto rounded-md"
                />
              </CarouselItem>
              <CarouselItem data-testid="carousel-item-event-decor">
                <img
                  src={eventDecorImg}
                  alt="Event Decoration"
                  className="w-full h-auto rounded-md"
                />
              </CarouselItem>
              <CarouselItem data-testid="carousel-item-bulk-order">
                <img
                  src={bulkOrderImg}
                  alt="Bulk Order Discounts"
                  className="w-full h-auto rounded-md"
                />
              </CarouselItem>
              <CarouselItem data-testid="carousel-item-delivery">
                <img
                  src={deliveryImg}
                  alt="Schedule Delivery"
                  className="w-full h-auto rounded-md"
                />
              </CarouselItem>
              <CarouselItem data-testid="carousel-item-priority">
                <img
                  src={priorityServiceImg}
                  alt="Priority Service"
                  className="w-full h-auto rounded-md"
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          
          {/* Carousel Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: slideCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-6 bg-[#1A9952]"
                    : "w-2 bg-gray-300"
                }`}
                data-testid={`carousel-dot-${index}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Enquiry Form */}
        <Card data-testid="card-corporate-form">
          <CardHeader>
            <CardTitle style={{ fontFamily: "Sweet Sans Pro" }}>
              Request a Quote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  data-testid="input-company-name"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Enter your company name"
                  required
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  data-testid="input-contact-person"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Your name"
                  required
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your.email@company.com"
                    className="pl-10 border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    data-testid="input-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10 border-[#1A9952] focus-visible:ring-[#1A9952]"
                    required
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label style={{ fontFamily: "Sweet Sans Pro", fontWeight: 600 }}>
                  Number of People & Dietary Preferences
                </Label>
                
                <div className="flex items-center gap-3">
                  <Input
                    id="veg"
                    type="number"
                    data-testid="input-veg"
                    value={formData.veg}
                    onChange={(e) =>
                      setFormData({ ...formData, veg: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-20 text-center border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#1A9952] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px" }}>VEG</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    id="nonVeg"
                    type="number"
                    data-testid="input-non-veg"
                    value={formData.nonVeg}
                    onChange={(e) =>
                      setFormData({ ...formData, nonVeg: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-20 text-center border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#DC2626] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px" }}>NON-VEG</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    id="egg"
                    type="number"
                    data-testid="input-egg"
                    value={formData.egg}
                    onChange={(e) =>
                      setFormData({ ...formData, egg: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                    className="w-20 text-center border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#92400E] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px" }}>EGG</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t">
                  <div 
                    className="w-20 h-10 flex items-center justify-center bg-gray-100 rounded-md text-center font-semibold"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                    data-testid="text-total-people"
                  >
                    {totalPeople}
                  </div>
                  <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 600 }}>
                    Total People
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  data-testid="input-event-type"
                  value={formData.eventType}
                  onChange={(e) =>
                    setFormData({ ...formData, eventType: e.target.value })
                  }
                  placeholder="e.g., Team Lunch, Conference, Meeting"
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              <div className="space-y-2">
                <Label style={{ fontFamily: "Sweet Sans Pro", fontWeight: 600 }}>
                  Budget per person (INR)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="budgetMin"
                    type="number"
                    data-testid="input-budget-min"
                    value={formData.budgetMin}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetMin: e.target.value })
                    }
                    placeholder="250"
                    min="0"
                    className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <Input
                    id="budgetMax"
                    type="number"
                    data-testid="input-budget-max"
                    value={formData.budgetMax}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetMax: e.target.value })
                    }
                    placeholder="500"
                    min="0"
                    className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label style={{ fontFamily: "Sweet Sans Pro", fontWeight: 600 }}>
                  Select Event Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#1A9952]" />
                    <Input
                      id="eventDate"
                      type="date"
                      data-testid="input-event-date"
                      value={formData.eventDate}
                      onChange={(e) =>
                        setFormData({ ...formData, eventDate: e.target.value })
                      }
                      required
                      className="pl-10 border-[#1A9952] focus-visible:ring-[#1A9952]"
                      style={{ fontFamily: "Sweet Sans Pro" }}
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-[#1A9952]" />
                    <Input
                      id="eventTime"
                      type="time"
                      data-testid="input-event-time"
                      value={formData.eventTime}
                      onChange={(e) =>
                        setFormData({ ...formData, eventTime: e.target.value })
                      }
                      className="pl-10 border-[#1A9952] focus-visible:ring-[#1A9952]"
                      style={{ fontFamily: "Sweet Sans Pro" }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Requests</Label>
                <Textarea
                  id="message"
                  data-testid="textarea-message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Please add any additional requests here"
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1A9952] hover:bg-[#1A9952]/90 text-white"
                data-testid="button-submit-quote"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "10px",
                }}
              >
                SEND ENQUIRY
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Continue Order Banner */}
      <ContinueOrderBanner />
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
