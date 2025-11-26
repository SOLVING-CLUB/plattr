// import { useState } from 'react';
// import { useLocation } from 'wouter';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Textarea } from '@/components/ui/textarea';
// import { useToast } from '@/hooks/use-toast';
// import BottomNav from '@/components/BottomNav';
// import { apiRequest } from '@/lib/queryClient';
// import { getApiUrl } from '@/config/api';
// import { 
//   MapPin,
//   ArrowLeft,
//   Calendar,
//   Clock
// } from 'lucide-react';
// import heroBackground from '@assets/Hero (5).png';
// import mealBoxImage4 from '@assets/Catering (5).png';
// import mealBoxImage2 from '@assets/MealBox (4).png';
// import cateringImage5 from '@assets/MealBox (2).png';
// import cateringImage7 from '@assets/Catering (7).png';
// import toggleImage from '@assets/Toggle.png';
// import micIcon from '@assets/lets-icons_mic-fill.png';
// import searchIcon from '@assets/lucide_search.png';
// import cartIcon from '@assets/Cart (1).png';
// import hiTeaImage from '@assets/Image (1).png';
// import breakfastImage from '@assets/Image (2).png';
// import lunchImage from '@assets/Rectangle 34625261.png';
// import dinnerImage from '@assets/9.png';


// export default function CateringPage(): JSX.Element {
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const [activeTab, setActiveTab] = useState('home');

//   // Debug: Log the image URL
//   console.log('Hero background image URL:', heroBackground);

//   const [formData, setFormData] = useState({
//     eventType: '',
//     numberOfPeople: '',
//     vegCount: '',
//     nonVegCount: '',
//     eggCount: '',
//     totalPeople: '',
//     cuisine: '',
//     budgetMin: '',
//     budgetMax: '',
//     mealTimes: [] as string[],
//     eventDate: '',
//     eventTime: '',
//     phone: '',
//     email: '',
//     message: ''
//   });


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
    
//     if (!formData.numberOfPeople) {
//       toast({
//         title: "Missing Information",
//         description: "Please enter the number of people.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     if (!formData.cuisine) {
//       toast({
//         title: "Missing Information",
//         description: "Please select a cuisine preference.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     if (!formData.budgetMin || !formData.budgetMax) {
//       toast({
//         title: "Missing Information",
//         description: "Please enter budget range.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     try {
//       // Calculate individual counts (allow empty/0 values)
//       const vegCount = parseInt(formData.vegCount) || 0;
//       const nonVegCount = parseInt(formData.nonVegCount) || 0;
//       const eggCount = parseInt(formData.eggCount) || 0;
      
//       // Use numberOfPeople or totalPeople, whichever is provided
//       let guestCount = parseInt(formData.numberOfPeople) || parseInt(formData.totalPeople) || 0;
//       if (guestCount === 0) {
//         // If neither is provided, calculate from individual counts
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

//       // Prepare data for API - matching database schema exactly
//       const cateringOrderData = {
//         event_type: formData.eventType,
//         guest_count: guestCount,
//         event_date: formData.eventDate || new Date().toISOString().split('T')[0], // Use provided date or current date
//         meal_times: formData.mealTimes.length > 0 ? formData.mealTimes : [], // Use selected meal times
//         dietary_types: dietaryTypes.length > 0 ? dietaryTypes : [], // Empty array if none specified
//         cuisines: formData.cuisine ? [formData.cuisine] : [], // Use selected cuisine
//         add_on_ids: null, // No additional services in this form
//         name: 'Catering Inquiry', // Default name
//         email: formData.email || '', // Use provided email
//         phone: formData.phone || '', // Use provided phone
//         message: formData.message 
//           ? `Budget: ${formData.budgetMin}-${formData.budgetMax} INR per person. ${formData.message}`
//           : `Budget: ${formData.budgetMin}-${formData.budgetMax} INR per person${formData.eventTime ? `. Time: ${formData.eventTime}` : ''}`, // Include budget and additional requests
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
//       {/* Purple Gradient Background */}
//       <div
//         className="absolute -z-10"
//         style={{
//           backgroundImage: `url("${heroBackground}")`,
//           backgroundSize: "100% auto",
//           backgroundPosition: "center top",
//           backgroundRepeat: "repeat-x",
//           top: 0,
//           left: 0,
//           right: 0,
//           width: "100%",
//           height: "500px",
//         }}
//       />
      
//       {/* White background for form section */}
//       <div
//         className="absolute -z-10"
//         style={{
//           backgroundColor: "#ffffff",
//           top: "500px",
//           left: 0,
//           right: 0,
//           bottom: 0,
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

//           {/* Catering Card - Active */}
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

//           {/* Corporate Card */}
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
//       </div>

//       <div className="max-w-7xl mx-auto px-4 pt-12 pb-6 relative z-10">

//         {/* Plan Your Perfect Event Form */}
//         <div className="mb-8" data-testid="card-quote-form">
//           <div className="mb-4 mt-20">
//             <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif", color: "#1a4d2e" }}>
//               Plan Your Perfect Event
//             </h2>
//             <p className="text-gray-700 mb-3" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
//               From small gatherings to grand celebrations, we'll tailor a menu and service experience that matches your event perfectly.
//             </p>
//             <p className="text-sm mb-4" style={{ color: "#1A9952", fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
//               All fields are required.
//             </p>
//           </div>
//           <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Event Type */}
//               <div className="space-y-2">
//                 <Label htmlFor="eventType">Event Type *</Label>
//                 <Input
//                   id="eventType"
//                   type="text"
//                   data-testid="input-event-type"
//                   required
//                   value={formData.eventType}
//                   onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
//                   placeholder="Ex. Marriage, Engagement, Reception....."
//                 />
//               </div>

//               {/* Number of People */}
//               <div className="space-y-2">
//                 <Label htmlFor="numberOfPeople">Number of People *</Label>
//                 <Input
//                   id="numberOfPeople"
//                   type="number"
//                   data-testid="input-number-of-people"
//                   required
//                   value={formData.numberOfPeople}
//                   onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
//                   placeholder="Ex. 100"
//                 />
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

//               {/* Cuisine preferences */}
//               <div className="space-y-2">
//                 <Label htmlFor="cuisine">Cuisine preferences *</Label>
//                 <Select
//                   value={formData.cuisine}
//                   onValueChange={(value) => setFormData({ ...formData, cuisine: value })}
//                   required
//                 >
//                   <SelectTrigger id="cuisine" data-testid="select-cuisine">
//                     <SelectValue placeholder="Select Preferred Cuisines" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="north-indian">North Indian</SelectItem>
//                     <SelectItem value="south-indian">South Indian</SelectItem>
//                     <SelectItem value="chinese">Chinese</SelectItem>
//                     <SelectItem value="continental">Continental</SelectItem>
//                     <SelectItem value="italian">Italian</SelectItem>
//                     <SelectItem value="mexican">Mexican</SelectItem>
//                     <SelectItem value="multi-cuisine">Multi-Cuisine</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Budget per person */}
//               <div className="space-y-2">
//                 <Label className="text-base font-semibold">Budget per person (INR) *</Label>
//                 <div className="flex items-center gap-3">
//                   <Input
//                     id="budgetMin"
//                     type="number"
//                     data-testid="input-budget-min"
//                     required
//                     value={formData.budgetMin}
//                     onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
//                     placeholder="Min"
//                     style={{ width: "120px" }}
//                   />
//                   <Input
//                     id="budgetMax"
//                     type="number"
//                     data-testid="input-budget-max"
//                     required
//                     value={formData.budgetMax}
//                     onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
//                     placeholder="Max"
//                     style={{ width: "120px" }}
//                   />
//                 </div>
//               </div>

//               {/* Select your meal time */}
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label className="text-base font-semibold">Select your meal time</Label>
//                   <span className="text-sm" style={{ color: "#1A9952", fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
//                     Multi Select
//                   </span>
//                 </div>
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="flex items-center gap-3">
//                     <Checkbox
//                       checked={formData.mealTimes.includes('hi-tea')}
//                       onCheckedChange={(checked) => {
//                         const mealTimes = checked
//                           ? [...formData.mealTimes, 'hi-tea']
//                           : formData.mealTimes.filter(m => m !== 'hi-tea');
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     />
//                     <div
//                       className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                       style={{ 
//                         borderColor: "#e5e7eb",
//                         width: "94.47px",
//                         height: "36.42px"
//                       }}
//                       onClick={() => {
//                         const mealTimes = formData.mealTimes.includes('hi-tea')
//                           ? formData.mealTimes.filter(m => m !== 'hi-tea')
//                           : [...formData.mealTimes, 'hi-tea'];
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     >
//                       <img
//                         src={hiTeaImage}
//                         alt="Hi-Tea"
//                         className="rounded-full object-cover"
//                         style={{ width: "27.13px", height: "27.13px" }}
//                       />
//                       <span
//                         className="text-sm font-medium"
//                         style={{
//                           fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                           color: "#000000"
//                         }}
//                       >
//                         Hi-Tea
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Checkbox
//                       checked={formData.mealTimes.includes('breakfast')}
//                       onCheckedChange={(checked) => {
//                         const mealTimes = checked
//                           ? [...formData.mealTimes, 'breakfast']
//                           : formData.mealTimes.filter(m => m !== 'breakfast');
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     />
//                     <div
//                       className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                       style={{ 
//                         borderColor: "#e5e7eb",
//                         width: "94.47px",
//                         height: "36.42px"
//                       }}
//                       onClick={() => {
//                         const mealTimes = formData.mealTimes.includes('breakfast')
//                           ? formData.mealTimes.filter(m => m !== 'breakfast')
//                           : [...formData.mealTimes, 'breakfast'];
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     >
//                       <img
//                         src={breakfastImage}
//                         alt="Breakfast"
//                         className="rounded-full object-cover"
//                         style={{ width: "27.13px", height: "27.13px" }}
//                       />
//                       <span
//                         className="text-sm font-medium"
//                         style={{
//                           fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                           color: "#000000"
//                         }}
//                       >
//                         Breakfast
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Checkbox
//                       checked={formData.mealTimes.includes('lunch')}
//                       onCheckedChange={(checked) => {
//                         const mealTimes = checked
//                           ? [...formData.mealTimes, 'lunch']
//                           : formData.mealTimes.filter(m => m !== 'lunch');
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     />
//                     <div
//                       className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                       style={{ 
//                         borderColor: "#e5e7eb",
//                         width: "94.47px",
//                         height: "36.42px"
//                       }}
//                       onClick={() => {
//                         const mealTimes = formData.mealTimes.includes('lunch')
//                           ? formData.mealTimes.filter(m => m !== 'lunch')
//                           : [...formData.mealTimes, 'lunch'];
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     >
//                       <img
//                         src={lunchImage}
//                         alt="Lunch"
//                         className="rounded-full object-cover"
//                         style={{ width: "27.13px", height: "27.13px" }}
//                       />
//                       <span
//                         className="text-sm font-medium"
//                         style={{
//                           fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                           color: "#000000"
//                         }}
//                       >
//                         Lunch
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Checkbox
//                       checked={formData.mealTimes.includes('dinner')}
//                       onCheckedChange={(checked) => {
//                         const mealTimes = checked
//                           ? [...formData.mealTimes, 'dinner']
//                           : formData.mealTimes.filter(m => m !== 'dinner');
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     />
//                     <div
//                       className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
//                       style={{ 
//                         borderColor: "#e5e7eb",
//                         width: "94.47px",
//                         height: "36.42px"
//                       }}
//                       onClick={() => {
//                         const mealTimes = formData.mealTimes.includes('dinner')
//                           ? formData.mealTimes.filter(m => m !== 'dinner')
//                           : [...formData.mealTimes, 'dinner'];
//                         setFormData({ ...formData, mealTimes });
//                       }}
//                     >
//                       <img
//                         src={dinnerImage}
//                         alt="Dinner"
//                         className="rounded-full object-cover"
//                         style={{ width: "27.13px", height: "27.13px" }}
//                       />
//                       <span
//                         className="text-sm font-medium"
//                         style={{
//                           fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                           color: "#000000"
//                         }}
//                       >
//                         Dinner
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Select Event Date & Time */}
//               <div className="space-y-2">
//                 <Label className="text-base font-semibold">Select Event Date & Time</Label>
//                 <div className="flex items-center gap-3">
//                   <div className="relative flex-1">
//                     <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//                     <Input
//                       id="eventDate"
//                       type="date"
//                       data-testid="input-event-date"
//                       value={formData.eventDate}
//                       onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
//                       min={new Date().toISOString().split('T')[0]}
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

//               {/* Enter Your Phone Number */}
//               <div className="space-y-2">
//                 <Label htmlFor="phone">Enter Your Phone Number</Label>
//                 <Input
//                   id="phone"
//                   type="tel"
//                   data-testid="input-phone"
//                   value={formData.phone}
//                   onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                   placeholder="+91 98552 12375"
//                 />
//               </div>

//               {/* Enter Your Email Address */}
//               <div className="space-y-2">
//                 <Label htmlFor="email">Enter Your Email Address</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   data-testid="input-email"
//                   value={formData.email}
//                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                   placeholder="example@email.com"
//                 />
//               </div>

//               {/* Additional Requests */}
//               <div className="space-y-2">
//                 <Label htmlFor="message">Additional Requests (if any)</Label>
//                 <Textarea
//                   id="message"
//                   data-testid="textarea-message"
//                   value={formData.message}
//                   onChange={(e) => setFormData({ ...formData, message: e.target.value })}
//                   placeholder="Please add any additional requests you might have."
//                   style={{
//                     fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//                     fontSize: "16px",
//                     fontWeight: "560",
//                     color: "#B6B6B6",
//                   }}
//                   className="placeholder:text-[#B6B6B6]"
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
//                 SEND ENQUIRY &gt;
//               </Button>
//             </form>
//         </div>
//       </div>

//       <BottomNav 
//         activeTab={activeTab}
//         onTabChange={handleTabChange}
//         cartItemCount={0}
//       />
//     </div>
//   );
// }

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Users, Calendar, Mail, Phone, MapPin, ShoppingCart, UtensilsCrossed, Package, Truck, Clock, X, ChevronDown } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import cateringHeroPattern from "@assets/Hero (5).png";
import customizedMenuImg from "@assets/stock_images/Menu (1).png";
import photographyImg from "@assets/stock_images/Photography.png";
import eventDecorImg from "@assets/stock_images/Event Decor.png";
import bulkOrderImg from "@assets/stock_images/Bulk Order.png";
import deliveryImg from "@assets/Delivery.png";
import priorityServiceImg from "@assets/stock_images/Priority Service.png";
import hiTeaIcon from "@assets/Image (1).png";
import breakfastIcon from "@assets/Image (2).png";
import lunchIcon from "@assets/9.png";
import dinnerIcon from "@assets/Rectangle 34625261.png";

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate";

export default function CateringOrder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const [selectedService, setSelectedService] = useState<ServiceType>("catering");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  
  const [formData, setFormData] = useState({
    eventType: "",
    numberOfPeople: "",
    veg: "",
    nonVeg: "",
    egg: "",
    cuisinePreferences: [] as string[],
    budgetMin: "",
    budgetMax: "",
    mealTimes: [] as string[],
    eventDate: "",
    eventTime: "",
    phone: "",
    email: "",
  });

  const [cuisineDropdownOpen, setCuisineDropdownOpen] = useState(false);
  const cuisineDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cuisineDropdownRef.current && !cuisineDropdownRef.current.contains(event.target as Node)) {
        setCuisineDropdownOpen(false);
      }
    };

    if (cuisineDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cuisineDropdownOpen]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/categories/lunch-dinner");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const handleMealTimeToggle = (mealTime: string) => {
    setFormData(prev => ({
      ...prev,
      mealTimes: prev.mealTimes.includes(mealTime)
        ? prev.mealTimes.filter(m => m !== mealTime)
        : [...prev.mealTimes, mealTime]
    }));
  };

  const handleCuisineToggle = (cuisine: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
  };

  const removeCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.filter(c => c !== cuisine)
    }));
  };

  const cuisineOptions = [
    { value: "north-indian", label: "North Indian" },
    { value: "south-indian", label: "South Indian" },
    { value: "chinese", label: "Chinese" },
    { value: "continental", label: "Continental" },
    { value: "italian", label: "Italian" },
    { value: "mexican", label: "Mexican" },
    { value: "multi-cuisine", label: "Multi-Cuisine" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.eventType || !formData.phone || !formData.eventDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to thank you page
    setLocation("/catering-thank-you");
  };

  return (
    <div className="min-h-screen pb-24 relative" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>
      {/* Purple Geometric Background Header */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          backgroundImage: `url("${cateringHeroPattern}")`,
          backgroundSize: "100% auto",
          backgroundPosition: "center top",
          backgroundRepeat: "repeat-x",
          height: "500px",
          width: "100%",
        }}
      />
      
      {/* White background for form section */}
      <div
        className="absolute z-0"
        style={{
          backgroundColor: "#ffffff",
          top: "500px",
          left: 0,
          right: 0,
          bottom: 0,
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
            onClick={() => setLocation("/meal-box")}
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
            onClick={() => setSelectedService("catering")}
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
            onClick={() => setLocation("/corporate")}
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
      <div className="relative z-10 px-4" style={{ marginTop: "80px", paddingTop: "16px" }}>

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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  data-testid="input-event-type"
                  value={formData.eventType}
                  onChange={(e) =>
                    setFormData({ ...formData, eventType: e.target.value })
                  }
                  placeholder="Ex: Marriage, Engagement, Reception..."
                  required
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              {/* Number of People */}
              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  data-testid="input-number-of-people"
                  value={formData.numberOfPeople}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfPeople: e.target.value })
                  }
                  placeholder="Ex: 100"
                  min="0"
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              {/* Dietary Preferences */}
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
                    placeholder="00"
                    min="0"
                    className="w-20 text-center border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-[#1A9952] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1A9952]" />
                    </div>
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>VEG</span>
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
                    placeholder="00"
                    min="0"
                    className="w-20 text-center border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-[#DC2626] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                    </div>
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>NON-VEG</span>
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
                    placeholder="00"
                    min="0"
                    className="w-20 text-center border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-[#92400E] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#92400E]" />
                    </div>
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>EGG</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div 
                    className="w-20 h-10 flex items-center justify-center bg-gray-100 rounded-md text-center font-semibold border border-gray-300"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                    data-testid="text-total-people"
                  >
                    {totalPeople || "00"}
                  </div>
                  <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 600 }}>
                    Total People
                  </span>
                </div>
              </div>

              {/* Cuisine Preferences */}
              <div className="space-y-2">
                <Label htmlFor="cuisinePreferences">Cuisine preferences</Label>
                <div className="relative" ref={cuisineDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCuisineDropdownOpen(!cuisineDropdownOpen)}
                    className="w-full flex items-center justify-between h-10 px-3 py-2 text-sm border-2 border-[#1A9952] rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                    data-testid="select-cuisine"
                  >
                    <span className="text-gray-500">
                      {formData.cuisinePreferences.length > 0 
                        ? `${formData.cuisinePreferences.length} selected`
                        : "Select Preferred Cuisines"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {cuisineDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-[#1A9952] rounded-md shadow-lg max-h-60 overflow-auto">
                      {cuisineOptions.map((cuisine) => (
                        <div
                          key={cuisine.value}
                          onClick={(e) => handleCuisineToggle(cuisine.value, e)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          data-testid={`cuisine-option-${cuisine.value}`}
                        >
                          <div 
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              formData.cuisinePreferences.includes(cuisine.value)
                                ? 'bg-[#1A9952] border-[#1A9952]'
                                : 'border-gray-400'
                            }`}
                          >
                            {formData.cuisinePreferences.includes(cuisine.value) && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px" }}>
                            {cuisine.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Cuisines Chips */}
                {formData.cuisinePreferences.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.cuisinePreferences.map((cuisineValue) => {
                      const cuisine = cuisineOptions.find(c => c.value === cuisineValue);
                      return (
                        <Badge
                          key={cuisineValue}
                          variant="secondary"
                          className="bg-[#1A9952]/10 text-[#1A9952] border border-[#1A9952] hover:bg-[#1A9952]/20 pl-3 pr-2 py-1"
                          style={{ fontFamily: "Sweet Sans Pro" }}
                          data-testid={`cuisine-chip-${cuisineValue}`}
                        >
                          <span className="mr-1">{cuisine?.label}</span>
                          <button
                            type="button"
                            onClick={() => removeCuisine(cuisineValue)}
                            className="hover:bg-[#1A9952]/30 rounded-full p-0.5"
                            data-testid={`remove-cuisine-${cuisineValue}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Budget */}
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
                    placeholder="Min"
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
                    placeholder="Max"
                    min="0"
                    className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  />
                </div>
              </div>

              {/* Meal Times */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label style={{ fontFamily: "Sweet Sans Pro", fontWeight: 600 }}>
                    Select your meal time
                  </Label>
                  <span 
                    className="text-xs text-[#1A9952]"
                    style={{ fontFamily: "Sweet Sans Pro", fontWeight: 500 }}
                  >
                    Multi Select
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => handleMealTimeToggle("hi-tea")}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.mealTimes.includes("hi-tea")
                        ? "border-[#1A9952] bg-[#1A9952]/5"
                        : "border-gray-300"
                    }`}
                    data-testid="checkbox-hi-tea"
                  >
                    <div 
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.mealTimes.includes("hi-tea")
                          ? 'bg-[#1A9952] border-[#1A9952]'
                          : 'border-gray-400'
                      }`}
                    >
                      {formData.mealTimes.includes("hi-tea") && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <img src={hiTeaIcon} alt="Hi-Tea" className="w-6 h-6 object-contain" />
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>
                      Hi-Tea
                    </span>
                  </div>
                  <div
                    onClick={() => handleMealTimeToggle("breakfast")}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.mealTimes.includes("breakfast")
                        ? "border-[#1A9952] bg-[#1A9952]/5"
                        : "border-gray-300"
                    }`}
                    data-testid="checkbox-breakfast"
                  >
                    <div 
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.mealTimes.includes("breakfast")
                          ? 'bg-[#1A9952] border-[#1A9952]'
                          : 'border-gray-400'
                      }`}
                    >
                      {formData.mealTimes.includes("breakfast") && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <img src={breakfastIcon} alt="Breakfast" className="w-6 h-6 object-contain" />
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>
                      Breakfast
                    </span>
                  </div>
                  <div
                    onClick={() => handleMealTimeToggle("lunch")}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.mealTimes.includes("lunch")
                        ? "border-[#1A9952] bg-[#1A9952]/5"
                        : "border-gray-300"
                    }`}
                    data-testid="checkbox-lunch"
                  >
                    <div 
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.mealTimes.includes("lunch")
                          ? 'bg-[#1A9952] border-[#1A9952]'
                          : 'border-gray-400'
                      }`}
                    >
                      {formData.mealTimes.includes("lunch") && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <img src={lunchIcon} alt="Lunch" className="w-6 h-6 object-contain" />
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>
                      Lunch
                    </span>
                  </div>
                  <div
                    onClick={() => handleMealTimeToggle("dinner")}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.mealTimes.includes("dinner")
                        ? "border-[#1A9952] bg-[#1A9952]/5"
                        : "border-gray-300"
                    }`}
                    data-testid="checkbox-dinner"
                  >
                    <div 
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.mealTimes.includes("dinner")
                          ? 'bg-[#1A9952] border-[#1A9952]'
                          : 'border-gray-400'
                      }`}
                    >
                      {formData.mealTimes.includes("dinner") && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <img src={dinnerIcon} alt="Dinner" className="w-6 h-6 object-contain" />
                    <span style={{ fontFamily: "Sweet Sans Pro", fontSize: "14px", fontWeight: 500 }}>
                      Dinner
                    </span>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label style={{ fontFamily: "Sweet Sans Pro", fontWeight: 600 }}>
                  Select Event Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
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
                      placeholder="10/05/2025"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
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
                      placeholder="12:00"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Enter Your Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+91 98552 12375"
                  required
                  className="border-[#1A9952] focus-visible:ring-[#1A9952]"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email">Enter Your Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="example@email.com"
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

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
