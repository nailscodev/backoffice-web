import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DateRangeContextType {
  dateRange: Date[];
  setDateRange: (dates: Date[]) => void;
  startDate: Date;
  endDate: Date;
  startLabel: string;
  endLabel: string;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

// Helper function to get week range (Monday to Sunday)
const getWeekRange = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = (day + 6) % 7; // days since Monday
  const start = new Date(date);
  start.setDate(date.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Load dates from localStorage or use current week as default
const getInitialDateRange = (): Date[] => {
  try {
    const stored = localStorage.getItem('nailsco_dateRange');
    if (stored) {
      const parsed = JSON.parse(stored);
      return [new Date(parsed[0]), new Date(parsed[1])];
    }
  } catch (error) {
    console.warn('Error loading date range from localStorage:', error);
  }
  
  // Default to current week
  const today = new Date();
  const { start, end } = getWeekRange(today);
  return [start, end];
};

export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dateRange, setDateRangeState] = useState<Date[]>(getInitialDateRange);

  // Persist to localStorage whenever dateRange changes
  useEffect(() => {
    try {
      if (dateRange && dateRange.length === 2) {
        localStorage.setItem('nailsco_dateRange', JSON.stringify(dateRange));
      }
    } catch (error) {
      console.warn('Error saving date range to localStorage:', error);
    }
  }, [dateRange]);

  const setDateRange = (dates: Date[]) => {
    if (dates && dates.length >= 1) {
      setDateRangeState(dates);
    }
  };

  // Derived values
  const startDate = dateRange && dateRange.length > 0 ? dateRange[0] : new Date();
  const endDate = dateRange && dateRange.length > 1 ? dateRange[1] : (dateRange && dateRange.length === 1 ? dateRange[0] : new Date());
  const startLabel = startDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const endLabel = endDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, startDate, endDate, startLabel, endLabel }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};
