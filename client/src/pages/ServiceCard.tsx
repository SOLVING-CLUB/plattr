import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardSectionProps {
  title: string;
  serviceId: string;
  description: string;
  onClick?: () => void;
  className?: string;
  backgroundImage?: string;
}

export default function ServiceCardSection({ 
  title,    serviceId,
  description,  backgroundImage,
  onClick,
  className
}: ServiceCardSectionProps) {
  return (
    <Card 
      className={cn(
        "hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 overflow-hidden h-full relative",
        className
      )}
      onClick={onClick}
      data-testid={`card-service-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <CardContent className="p-3 flex flex-col h-full relative z-10">
        {/* Title & Description - Top Left Aligned */}
        <div className="text-left mb-2">
          <h3 
            className="text-base font-bold mb-0.5" 
            style={{ color: '#06352A' }}
            data-testid={`text-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {title}
          </h3>
          <p 
            className="text-xs"
            style={{ color: '#06352A' }}
          >
            {description}
          </p>
        </div>

        {/* Arrow Icon - Below Text with Radial Gradient */}
        <div>
          <div 
            className="inline-flex items-center justify-center w-10 h-10 rounded-full"
            style={{
              background: 'radial-gradient(circle, #1A9952 0%, #06352A 100%)'
            }}
          >
            <ChevronRight className="w-[15px] h-[15px] text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}