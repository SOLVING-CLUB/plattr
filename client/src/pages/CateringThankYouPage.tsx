import { useEffect } from 'react';
import { useLocation } from 'wouter';
import BottomNav from '@/components/BottomNav';
import okHandIcon from '@assets/Group 2087328361.png';
import thankBackground from '@assets/TE-Vintage-01 3 (2).png';
import type { CSSProperties } from 'react';

export default function CateringThankYouPage() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      setLocation('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleTabChange = (tab: string) => {
    if (tab === 'home') {
      setLocation('/');
    } else if (tab === 'categories') {
      setLocation('/categories');
    } else if (tab === 'profile') {
      setLocation('/profile');
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.backgroundImage,
          backgroundImage: `url(${thankBackground})`,
        }}
      >
        {/* Overlay with white background */}
        <div style={styles.overlay}>
          {/* Content Card */}
          <div style={styles.content}>
            {/* Icon Container */}
            <div style={styles.iconContainer}>
              <img
                src={okHandIcon}
                alt="Success"
                style={styles.iconImage}
              />
            </div>

            {/* Heading */}
            <h1 style={styles.heading}>Thank you!</h1>

            {/* Text Container */}
            <div style={styles.textContainer}>
              <p style={{ ...styles.bodyText, ...styles.bodyTextGreen }}>
                Your enquiry has been successfully sent
              </p>
              <p style={styles.bodyText}>
                Our team will contact you shortly to confirm your order details and the delivery schedule.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" onTabChange={handleTabChange} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  content: {
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '20px',
    maxWidth: '500px',
    width: '100%',
  },
  iconContainer: {
    marginBottom: '20px',
  },
  iconImage: {
    width: '60px',
    height: '60px',
    objectFit: 'contain' as const,
  },
  heading: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
    textAlign: 'center' as const,
    fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
  },
  textContainer: {
    alignItems: 'center',
  },
  bodyText: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: '8px',
    lineHeight: '24px',
    fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
  },
  bodyTextGreen: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: '16px',
  },
};

