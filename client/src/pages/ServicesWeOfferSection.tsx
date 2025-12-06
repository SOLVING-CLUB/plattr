import ServiceCardSection from "@/pages/ServiceCard";
import mealBoxImage from "@assets/Tiffin_1764989484948.png";
import cateringImage from "@assets/Tiffin5_1764990291688.png";
import bulkMealImage from "@assets/Tiffin8_1764990094179.png";
import corporateImage from "@assets/Tiffin10_1764990422090.png";

interface ServicesWeOfferSectionProps {
  onServiceClick?: (serviceId: string) => void;
}

export default function ServicesWeOfferSection({ onServiceClick }: ServicesWeOfferSectionProps) {
  return (
    <section className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <h2 className="text-2xl font-bold mb-6" data-testid="text-services-heading">
          Services We Offer
        </h2>

        {/* Mobile-First Grid Layout */}
        <div className="grid grid-cols-2 gap-4" style={{ gridTemplateRows: 'auto auto auto' }}>
          {/* MealBox - Top Left */}
          <ServiceCardSection
            serviceId="mealbox"
            title="MealBox"
            description="Custom-packed meals"
            onClick={() => onServiceClick?.("mealbox")}
            className="h-[160px]"
            backgroundImage={mealBoxImage}
          />

          {/* Bulk Meal Delivery - Right side, spans 2 rows */}
          <ServiceCardSection
            serviceId="bulk"
            title="Bulk Meal Delivery"
            description="Order large portions"
            onClick={() => onServiceClick?.("bulk")}
            className="row-span-2 h-[328px]"
            backgroundImage={bulkMealImage}
          />

          {/* Catering - Bottom Left */}
          <ServiceCardSection
            serviceId="catering"
            title="Catering"
            description="End-to-end service"
            onClick={() => onServiceClick?.("catering")}
            className="h-[160px]"
            backgroundImage={cateringImage}
          />

          {/* Corporate Order - Bottom, spans full width */}
          <ServiceCardSection
            serviceId="corporate"
            title="Corporate Order"
            description="Customizations & more"
            onClick={() => onServiceClick?.("corporate")}
            className="col-span-2 h-[160px]"
            backgroundImage={corporateImage}
          />
        </div>
      </div>
    </section>
  );
}