import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

export function formatSmartDate(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Today';
    }
    
    if (isTomorrow(date)) {
      return 'Tomorrow';
    }
    
    if (isThisWeek(date)) {
      return format(date, 'EEEE'); // Monday, Tuesday, etc.
    }
    
    return format(date, 'MMM d'); // Oct 27
  } catch {
    return '';
  }
}

export function formatTimeEstimate(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

export function parseTimeEstimate(input: string): number | null {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase().trim();
  
  // Match patterns like "2h", "30m", "1h 30m", "1.5 hours", "90 minutes"
  const patterns = [
    { regex: /^(\d+(?:\.\d+)?)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:ute)?s?)?)?$/i, parse: (m: RegExpMatchArray) => {
      const hours = parseFloat(m[1]);
      const mins = m[2] ? parseInt(m[2]) : 0;
      return Math.round(hours * 60 + mins);
    }},
    { regex: /^(\d+)\s*m(?:in(?:ute)?s?)?$/i, parse: (m: RegExpMatchArray) => parseInt(m[1]) },
    { regex: /^(\d+(?:\.\d+)?)\s*hours?$/i, parse: (m: RegExpMatchArray) => Math.round(parseFloat(m[1]) * 60) },
    { regex: /^(\d+)\s*minutes?$/i, parse: (m: RegExpMatchArray) => parseInt(m[1]) },
  ];
  
  for (const { regex, parse } of patterns) {
    const match = lowerInput.match(regex);
    if (match) {
      return parse(match);
    }
  }
  
  return null;
}

export function parseDueDate(input: string): string | null {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase().trim();
  const today = new Date();
  
  if (lowerInput === 'today') {
    return format(today, 'yyyy-MM-dd');
  }
  
  if (lowerInput === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  }
  
  // Match "next monday", "next friday", etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nextDayMatch = lowerInput.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i);
  if (nextDayMatch) {
    const targetDay = dayNames.indexOf(nextDayMatch[1].toLowerCase());
    const daysUntil = (targetDay - today.getDay() + 7) % 7 || 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return format(targetDate, 'yyyy-MM-dd');
  }
  
  // Match "in X days"
  const inDaysMatch = lowerInput.match(/^in\s+(\d+)\s+days?$/i);
  if (inDaysMatch) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + parseInt(inDaysMatch[1]));
    return format(targetDate, 'yyyy-MM-dd');
  }
  
  // Try to parse as ISO date or common formats
  try {
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}
