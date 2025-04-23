
import { useQuery, useMutation } from '@tanstack/react-query';
import { checkPHQ9ForAppointment, savePHQ9Assessment } from '../services/assessments';
import { getDefaultQueryOptions } from '../utils/queryHelpers';

export const usePHQ9Check = (appointmentId: string | undefined) => {
  return useQuery({
    ...getDefaultQueryOptions(['phq9', appointmentId]),
    queryFn: () => {
      if (!appointmentId) return null;
      return checkPHQ9ForAppointment(appointmentId);
    },
    enabled: !!appointmentId
  });
};

export const useSavePHQ9 = () => {
  return useMutation({
    mutationFn: savePHQ9Assessment
  });
};
