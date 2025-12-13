import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimeSlot {
  label: string;
  value: string;
}

interface TimePeriod {
  id: string;
  label: string;
  slots: TimeSlot[];
}

interface DeliveryTimePickerProps {
  mealType?: "breakfast" | "lunch-dinner" | "snacks" | "all";
  value?: string;
  onChange: (time: string) => void;
}

const BREAKFAST_PERIODS: TimePeriod[] = [
  {
    id: "morning",
    label: "Morning",
    slots: [
      { label: "7:00 AM - 8:00 AM", value: "7:00 AM - 8:00 AM" },
      { label: "8:00 AM - 9:00 AM", value: "8:00 AM - 9:00 AM" },
      { label: "9:00 AM - 10:00 AM", value: "9:00 AM - 10:00 AM" },
      { label: "10:00 AM - 11:00 AM", value: "10:00 AM - 11:00 AM" },
    ],
  },
  {
    id: "evening",
    label: "Evening",
    slots: [
      { label: "3:30 PM - 4:30 PM", value: "3:30 PM - 4:30 PM" },
      { label: "4:30 PM - 5:30 PM", value: "4:30 PM - 5:30 PM" },
      { label: "5:30 PM - 6:30 PM", value: "5:30 PM - 6:30 PM" },
      { label: "6:30 PM - 7:30 PM", value: "6:30 PM - 7:30 PM" },
      { label: "7:30 PM - 8:30 PM", value: "7:30 PM - 8:30 PM" },
      { label: "8:30 PM - 9:30 PM", value: "8:30 PM - 9:30 PM" },
    ],
  },
];

const LUNCH_DINNER_PERIODS: TimePeriod[] = [
  {
    id: "afternoon",
    label: "Afternoon",
    slots: [
      { label: "12:30 PM - 1:30 PM", value: "12:30 PM - 1:30 PM" },
      { label: "1:30 PM - 2:30 PM", value: "1:30 PM - 2:30 PM" },
      { label: "2:30 PM - 3:30 PM", value: "2:30 PM - 3:30 PM" },
    ],
  },
  {
    id: "night",
    label: "Night",
    slots: [
      { label: "6:30 PM - 7:30 PM", value: "6:30 PM - 7:30 PM" },
      { label: "7:30 PM - 8:30 PM", value: "7:30 PM - 8:30 PM" },
      { label: "8:30 PM - 9:30 PM", value: "8:30 PM - 9:30 PM" },
    ],
  },
];

const SNACKS_PERIODS: TimePeriod[] = [
  {
    id: "afternoon",
    label: "Afternoon",
    slots: [
      { label: "2:00 PM - 3:00 PM", value: "2:00 PM - 3:00 PM" },
      { label: "3:00 PM - 4:00 PM", value: "3:00 PM - 4:00 PM" },
      { label: "4:00 PM - 5:00 PM", value: "4:00 PM - 5:00 PM" },
      { label: "5:00 PM - 6:00 PM", value: "5:00 PM - 6:00 PM" },
    ],
  },
  {
    id: "evening",
    label: "Evening",
    slots: [
      { label: "6:00 PM - 7:00 PM", value: "6:00 PM - 7:00 PM" },
      { label: "7:00 PM - 8:00 PM", value: "7:00 PM - 8:00 PM" },
      { label: "8:00 PM - 9:00 PM", value: "8:00 PM - 9:00 PM" },
    ],
  },
];

const ALL_PERIODS: TimePeriod[] = [
  {
    id: "morning",
    label: "Morning",
    slots: [
      { label: "7:00 AM - 8:00 AM", value: "7:00 AM - 8:00 AM" },
      { label: "8:00 AM - 9:00 AM", value: "8:00 AM - 9:00 AM" },
      { label: "9:00 AM - 10:00 AM", value: "9:00 AM - 10:00 AM" },
      { label: "10:00 AM - 11:00 AM", value: "10:00 AM - 11:00 AM" },
      { label: "11:00 AM - 12:00 PM", value: "11:00 AM - 12:00 PM" },
    ],
  },
  {
    id: "afternoon",
    label: "Afternoon",
    slots: [
      { label: "12:00 PM - 1:00 PM", value: "12:00 PM - 1:00 PM" },
      { label: "1:00 PM - 2:00 PM", value: "1:00 PM - 2:00 PM" },
      { label: "2:00 PM - 3:00 PM", value: "2:00 PM - 3:00 PM" },
      { label: "3:00 PM - 4:00 PM", value: "3:00 PM - 4:00 PM" },
      { label: "4:00 PM - 5:00 PM", value: "4:00 PM - 5:00 PM" },
    ],
  },
  {
    id: "evening",
    label: "Evening",
    slots: [
      { label: "5:00 PM - 6:00 PM", value: "5:00 PM - 6:00 PM" },
      { label: "6:00 PM - 7:00 PM", value: "6:00 PM - 7:00 PM" },
      { label: "7:00 PM - 8:00 PM", value: "7:00 PM - 8:00 PM" },
      { label: "8:00 PM - 9:00 PM", value: "8:00 PM - 9:00 PM" },
    ],
  },
];

function getPeriods(mealType: string): TimePeriod[] {
  switch (mealType) {
    case "breakfast":
      return BREAKFAST_PERIODS;
    case "lunch-dinner":
      return LUNCH_DINNER_PERIODS;
    case "snacks":
      return SNACKS_PERIODS;
    default:
      return ALL_PERIODS;
  }
}

export default function DeliveryTimePicker({ 
  mealType = "all", 
  value, 
  onChange 
}: DeliveryTimePickerProps) {
  const periods = getPeriods(mealType);
  const [activePeriod, setActivePeriod] = useState(periods[0]?.id || "");

  useEffect(() => {
    if (value) {
      for (const period of periods) {
        if (period.slots.some(slot => slot.value === value)) {
          setActivePeriod(period.id);
          break;
        }
      }
    }
  }, [value, periods]);

  const currentPeriod = periods.find(p => p.id === activePeriod) || periods[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-500" />
        <span 
          className="font-medium text-gray-800"
          style={{ fontFamily: "Sweet Sans Pro" }}
        >
          Delivery time
        </span>
        <span 
          className="ml-auto text-gray-500 text-sm"
          style={{ fontFamily: "Sweet Sans Pro" }}
        >
          {value || "Select time"}
        </span>
      </div>

      <div 
        className="inline-flex bg-gray-100 rounded-full p-1"
        data-testid="time-period-toggle"
      >
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => setActivePeriod(period.id)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activePeriod === period.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid={`button-period-${period.id}`}
          >
            {period.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentPeriod?.slots.map((slot) => (
          <button
            key={slot.value}
            onClick={() => onChange(slot.value)}
            className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
              value === slot.value
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid={`button-time-${slot.value}`}
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}
