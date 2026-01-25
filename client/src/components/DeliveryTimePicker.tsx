import { useState, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { parse, addHours, isBefore, isToday, startOfDay } from "date-fns";

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
  selectedDate?: string;
  disabledPeriods?: string[]; // Array of period IDs to disable (e.g., ["morning", "afternoon"])
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
      { label: "9:00 PM - 10:00 PM", value: "9:00 PM - 10:00 PM" },
      { label: "10:00 PM - 11:00 PM", value: "10:00 PM - 11:00 PM" },
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

function parseTimeSlot(slotValue: string): Date {
  const startTime = slotValue.split(" - ")[0];
  return parse(startTime, "h:mm a", new Date());
}

function isSlotDisabled(slotValue: string, selectedDate?: string): boolean {
  if (!selectedDate) return false;
  
  const deliveryDate = new Date(selectedDate);
  const today = startOfDay(new Date());
  const deliveryDay = startOfDay(deliveryDate);
  
  if (isBefore(today, deliveryDay)) {
    return false;
  }
  
  if (!isToday(deliveryDate)) {
    return false;
  }
  
  const now = new Date();
  const minDeliveryTime = addHours(now, 12);
  
  const slotTime = parseTimeSlot(slotValue);
  const slotDateTime = new Date(deliveryDate);
  slotDateTime.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);
  
  return isBefore(slotDateTime, minDeliveryTime);
}

export default function DeliveryTimePicker({ 
  mealType = "all", 
  value, 
  onChange,
  selectedDate,
  disabledPeriods = []
}: DeliveryTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const periods = getPeriods(mealType);
  
  // Filter out disabled periods
  const enabledPeriods = periods.filter(p => !disabledPeriods.includes(p.id));
  
  // Initialize active period to first enabled period
  const [activePeriod, setActivePeriod] = useState(enabledPeriods[0]?.id || periods[0]?.id || "");
  const [userSelectedPeriod, setUserSelectedPeriod] = useState<string | null>(null);

  // Sync activePeriod with value only if user hasn't manually selected a different period
  useEffect(() => {
    if (value) {
      const valuePeriod = periods.find(p => p.slots.some(slot => slot.value === value));
      if (valuePeriod) {
        // If user hasn't manually selected a period, sync period with value
        // Or if value matches user's selected period, keep it in sync
        if (!userSelectedPeriod || valuePeriod.id === userSelectedPeriod) {
          if (!disabledPeriods.includes(valuePeriod.id)) {
            setActivePeriod(valuePeriod.id);
          }
        }
      }
    } else if (!value && !userSelectedPeriod) {
      // If no value and no user selection, default to first enabled period
      if (enabledPeriods.length > 0 && activePeriod !== enabledPeriods[0].id) {
        setActivePeriod(enabledPeriods[0].id);
      }
    }
  }, [value, periods, disabledPeriods, userSelectedPeriod, enabledPeriods, activePeriod]);

  // If current active period becomes disabled, switch to first enabled period
  useEffect(() => {
    if (disabledPeriods.includes(activePeriod) && enabledPeriods.length > 0) {
      const newPeriod = enabledPeriods[0].id;
      setActivePeriod(newPeriod);
      setUserSelectedPeriod(newPeriod);
    }
  }, [disabledPeriods, activePeriod, enabledPeriods]);

  const currentPeriod = periods.find(p => p.id === activePeriod) || enabledPeriods[0] || periods[0];

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      style={{ fontFamily: "Sweet Sans Pro" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        data-testid="button-toggle-time-picker"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-800">Delivery time</span>
          {value && (
            <span className="text-xs text-gray-400 font-normal">(click to change)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${value ? "text-gray-900 font-medium" : "text-gray-500"}`}>
            {value || "Select time"}
          </span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          <div 
            className="flex w-full bg-gray-100 rounded-full p-1"
            data-testid="time-period-toggle"
          >
            {periods.map((period) => {
              const isDisabled = disabledPeriods.includes(period.id);
              return (
                <button
                  key={period.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setActivePeriod(period.id);
                      setUserSelectedPeriod(period.id); // Mark that user manually selected this period
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex-1 px-4 py-2 rounded-full text-xs font-medium transition-colors text-center ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed text-gray-400"
                      : activePeriod === period.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid={`button-period-${period.id}`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {currentPeriod?.slots.map((slot) => {
              const disabled = isSlotDisabled(slot.value, selectedDate);
              const isSelected = value === slot.value;
              return (
                <button
                  key={slot.value}
                  onClick={() => {
                    if (!disabled) {
                      // Always call onChange, even if it's the same value, to allow re-selection
                      onChange(slot.value);
                      // Clear user selected period when a slot is selected, so value can control period
                      setUserSelectedPeriod(null);
                    }
                  }}
                  disabled={disabled}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-colors ${
                    disabled
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : isSelected
                        ? "border-orange-500 bg-orange-50 text-orange-700 hover:border-orange-600"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid={`button-time-${slot.value}`}
                  type="button"
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
