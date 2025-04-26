
// Update to handle availabilityService.getSettingsForClinician method instead of getSettings

import { useState, useEffect } from 'react';
import { availabilityService } from '@/services/availabilityService';
import { AvailabilitySettings } from '@/types/availability';

export const useAvailability = (clinicianId: string | null) => {
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!clinicianId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fix this line to use getSettingsForClinician
        const data = await availabilityService.getSettingsForClinician(clinicianId);
        setSettings(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching availability settings:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [clinicianId]);

  return { settings, loading, error };
};
