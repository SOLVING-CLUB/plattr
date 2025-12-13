import { useState, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay } from "date-fns";

interface DeliveryDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  minDate?: Date;
}

export default function DeliveryDatePicker({ 
  value, 
  onChange,
  minDate = new Date()
}: DeliveryDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const today = startOfDay(new Date());
  const effectiveMinDate = startOfDay(minDate);
  
  const selectedDate = value ? new Date(value) : null;
  
  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      result.push(addMonths(today, i));
    }
    return result;
  }, []);

  const getDaysInMonth = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    
    const startDayOfWeek = start.getDay();
    const paddedDays: (Date | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      paddedDays.push(null);
    }
    
    return [...paddedDays, ...days];
  };

  const handleDateClick = (date: Date) => {
    if (isBefore(date, effectiveMinDate)) return;
    onChange(format(date, "yyyy-MM-dd"));
  };

  const dayHeaders = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      style={{ fontFamily: "Sweet Sans Pro" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        data-testid="button-toggle-date-picker"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">When</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
          </span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-7 gap-1 mb-2 pt-4">
            {dayHeaders.map((day) => (
              <div 
                key={day} 
                className="text-center text-xs font-medium text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {months.map((monthDate, monthIndex) => (
              <div key={monthIndex} className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                  {format(monthDate, "MMMM yyyy")}
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(monthDate).map((day, dayIndex) => {
                    if (!day) {
                      return <div key={`empty-${dayIndex}`} className="h-10" />;
                    }

                    const isPast = isBefore(day, effectiveMinDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDateClick(day)}
                        disabled={isPast}
                        className={`h-10 w-full rounded-lg text-sm font-medium transition-colors
                          ${isPast 
                            ? "text-gray-300 cursor-not-allowed" 
                            : isSelected 
                              ? "bg-orange-500 text-white" 
                              : isToday
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "text-gray-900 hover:bg-gray-100"
                          }`}
                        data-testid={`button-date-${format(day, "yyyy-MM-dd")}`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
