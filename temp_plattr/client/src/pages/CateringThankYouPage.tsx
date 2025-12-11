// import { useEffect } from 'react';
// import { useLocation } from 'wouter';
// import BottomNav from '@/components/BottomNav';
// import okHandIcon from '@assets/Group 2087328361.png';
// import thankBackground from '@assets/TE-Vintage-01 3 (2).png';
// import type { CSSProperties } from 'react';

// export default function CateringThankYouPage() {
//   const [location, setLocation] = useLocation();

//   useEffect(() => {
//     // Redirect after 3 seconds
//     const timer = setTimeout(() => {
//       setLocation('/');
//     }, 3000);

//     return () => clearTimeout(timer);
//   }, [setLocation]);

//   const handleTabChange = (tab: string) => {
//     if (tab === 'home') {
//       setLocation('/');
//     } else if (tab === 'categories') {
//       setLocation('/categories');
//     } else if (tab === 'profile') {
//       setLocation('/profile');
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div
//         style={{
//           ...styles.backgroundImage,
//           backgroundImage: `url(${thankBackground})`,
//         }}
//       >
//         {/* Overlay with white background */}
//         <div style={styles.overlay}>
//           {/* Content Card */}
//           <div style={styles.content}>
//             {/* Icon Container */}
//             <div style={styles.iconContainer}>
//               <img
//                 src={okHandIcon}
//                 alt="Success"
//                 style={styles.iconImage}
//               />
//             </div>

//             {/* Heading */}
//             <h1 style={styles.heading}>Thank you!</h1>

//             {/* Text Container */}
//             <div style={styles.textContainer}>
//               <p style={{ ...styles.bodyText, ...styles.bodyTextGreen }}>
//                 Your enquiry has been successfully sent
//               </p>
//               <p style={styles.bodyText}>
//                 Our team will contact you shortly to confirm your order details and the delivery schedule.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNav activeTab="home" onTabChange={handleTabChange} />
//     </div>
//   );
// }

// const styles: Record<string, CSSProperties> = {
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//     minHeight: '100vh',
//     display: 'flex',
//     flexDirection: 'column',
//     fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//   },
//   backgroundImage: {
//     flex: 1,
//     width: '100%',
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//     backgroundRepeat: 'no-repeat',
//   },
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: '20px',
//   },
//   content: {
//     alignItems: 'center',
//     padding: '20px',
//     backgroundColor: 'white',
//     borderRadius: '20px',
//     maxWidth: '500px',
//     width: '100%',
//   },
//   iconContainer: {
//     marginBottom: '20px',
//   },
//   iconImage: {
//     width: '60px',
//     height: '60px',
//     objectFit: 'contain' as const,
//   },
//   heading: {
//     fontSize: '28px',
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: '16px',
//     textAlign: 'center' as const,
//     fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//   },
//   textContainer: {
//     alignItems: 'center',
//   },
//   bodyText: {
//     fontSize: '16px',
//     color: '#666',
//     textAlign: 'center' as const,
//     marginBottom: '8px',
//     lineHeight: '24px',
//     fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
//   },
//   bodyTextGreen: {
//     color: '#4CAF50',
//     fontWeight: '600',
//     marginBottom: '16px',
//   },
// };


import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import handIconImg from "@assets/Group 2087328969 (1).png";
import bgPatternImg from "@assets/image 1668 (1).png";
  import pkLogoImg from "@assets/TE-Vintage-01 3 (2).png";

export default function CateringThankYou() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between py-12 px-4 relative overflow-hidden"
      style={{
        position: "relative",
      }}
    >
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgPatternImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#F5F5F0",
          width: "100%",
          height: "100%",
          minHeight: "100vh",
        }}
      />
      
      {/* Top Section with Icon and Messages */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto z-10 relative">
        {/* Hand Icon */}
        <div className="mb-6">
          <img 
            src={handIconImg} 
            alt="Success" 
            className="w-20 h-20"
            data-testid="img-success-icon"
          />
        </div>

        {/* Thank You Message */}
        <h1 
          className="text-2xl font-bold mb-4"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            color: "#1A9952" 
          }}
          data-testid="text-thank-you-heading"
        >
          Thank you!
        </h1>

        <p 
          className="text-sm mb-6"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            color: "#1A9952",
            fontWeight: 600
          }}
          data-testid="text-enquiry-sent"
        >
          Your enquiry has been successfully sent
        </p>

        <p 
          className="text-xs leading-relaxed mb-8"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            color: "#06352A"
          }}
          data-testid="text-followup-message"
        >
          Our team will contact you shortly to confirm your order details and the delivery schedule.
        </p>

        {/* Back to Home Button */}
        <Button
          onClick={() => setLocation("/")}
          data-testid="button-back-to-home"
          className="px-8"
          style={{
            backgroundColor: "#1A9952",
            color: "white",
            fontFamily: "Sweet Sans Pro",
            fontWeight: 600,
          }}
        >
          Back to Home
        </Button>
      </div>

      {/* Bottom Section with PK Logo */}
      <div className="relative w-full max-w-md mx-auto mt-8 z-10">
        <img 
          src={pkLogoImg} 
          alt="PK Logo" 
          className="w-full h-auto"
          style={{
            maxWidth: "280px",
            margin: "0 auto",
            display: "block"
          }}
          data-testid="img-pk-logo"
        />
      </div>
    </div>
  );
}


