import { Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import biryaniImg from "@assets/Items in Spotlight_1763857996794.png";
import gulabJamunImg from "@assets/Spotlight Item.png";
import secondaryLogo from "@assets/TE-Vintage-01 3 (2).png"
interface SpotlightItem {
  id: string;
  image: string;
}

const spotlightItems: SpotlightItem[] = [
  {
    id: "1",
    image: biryaniImg,
  },
  {
    id: "2",
    image: gulabJamunImg,
  }
];

export default function SpotlightFeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="w-full relative -mx-4">
      {/* Scrollable Spotlight Items */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-0 snap-x snap-mandatory">
          {spotlightItems.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-screen snap-center relative inline-block"
              data-testid={`card-spotlight-${item.id}`}
            >
              <div 
                className="relative inline-block w-full"
                style={{
                  background: 'radial-gradient(circle at center, #FDD29B 0%, rgba(253, 210, 155, 0) 100%)'
                }}
              >
                {/* Secondary Logo - Top Left (only on first item) */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-20">
                    <img 
                      src={secondaryLogo} 
                      alt="Plattr" 
                      className="w-10 h-10 object-contain"
                      data-testid="img-secondary-logo"
                    />
                  </div>
                )}
                
                <img
                  src={item.image}
                  alt={`Spotlight item ${item.id}`}
                  className="w-full h-auto block"
                  data-testid={`img-spotlight-${item.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
        {spotlightItems.map((_, index) => (
          <div
            key={index}
            className="rounded-full transition-all"
            style={{
              width: index === activeIndex ? '24px' : '6px',
              height: '6px',
              backgroundColor: index === activeIndex ? '#000000' : 'rgba(0, 0, 0, 0.3)'
            }}
            data-testid={`dot-spotlight-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
