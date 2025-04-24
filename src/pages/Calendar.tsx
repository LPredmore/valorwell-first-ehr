
import { getDayOfWeek } from '@/utils/dateUtils';

// In handleAvailabilityClick method
const handleAvailabilityClick = (event: any) => {
  const startDate = event.start;
  const dayOfWeek = getDayOfWeek(new Date(startDate));
  setSelectedAvailabilityDate(dayOfWeek);
  setIsWeeklyAvailabilityOpen(true);
};
