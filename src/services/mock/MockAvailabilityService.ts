
import { DateTime } from 'luxon';
import { WeeklyAvailability, AvailabilitySlot, DayOfWeek } from '@/types/availability';
import { TimeZoneService } from '@/utils/timezone';

/**
 * Mock availability service that replaces database interactions
 */
class MockAvailabilityService {
  private storageKey = 'mock_availability_data';
  private settingsKey = 'mock_availability_settings';
  
  /**
   * Get weekly availability for a clinician
   */
  async getWeeklyAvailabilityForClinician(clinicianId: string): Promise<WeeklyAvailability> {
    const storedData = this.getDataFromStorage();
    
    // If no data exists for this clinician, generate sample data
    if (!storedData[clinicianId]) {
      storedData[clinicianId] = this.generateSampleAvailability();
      this.saveDataToStorage(storedData);
    }
    
    return storedData[clinicianId];
  }
  
  /**
   * Create an availability slot
   */
  async createAvailabilitySlot(
    clinicianId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    isRecurring: boolean = true,
    recurrenceRule?: string,
    timeZone?: string,
    specificDate?: string | Date | DateTime
  ): Promise<{ id?: string }> {
    try {
      const storedData = this.getDataFromStorage();
      
      // Initialize if not exists
      if (!storedData[clinicianId]) {
        storedData[clinicianId] = this.generateSampleAvailability();
      }
      
      // Create new slot
      const newSlot: AvailabilitySlot = {
        id: this.generateId(),
        startTime,
        endTime,
        isRecurring,
        isAppointment: false,
      };
      
      // Add slot to appropriate day
      if (!storedData[clinicianId][dayOfWeek]) {
        storedData[clinicianId][dayOfWeek] = [];
      }
      
      storedData[clinicianId][dayOfWeek].push(newSlot);
      this.saveDataToStorage(storedData);
      
      return { id: newSlot.id };
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    }
  }
  
  /**
   * Update an availability slot
   */
  async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>): Promise<boolean> {
    try {
      const storedData = this.getDataFromStorage();
      let updated = false;
      
      // Search through all clinicians and days
      Object.keys(storedData).forEach(clinicianId => {
        Object.keys(storedData[clinicianId]).forEach(day => {
          const slots = storedData[clinicianId][day as DayOfWeek];
          const slotIndex = slots.findIndex(slot => slot.id === slotId);
          
          if (slotIndex !== -1) {
            storedData[clinicianId][day as DayOfWeek][slotIndex] = {
              ...slots[slotIndex],
              ...updates
            };
            updated = true;
          }
        });
      });
      
      if (updated) {
        this.saveDataToStorage(storedData);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating availability slot:', error);
      return false;
    }
  }
  
  /**
   * Delete an availability slot
   */
  async deleteAvailabilitySlot(slotId: string): Promise<boolean> {
    try {
      const storedData = this.getDataFromStorage();
      let deleted = false;
      
      // Search through all clinicians and days
      Object.keys(storedData).forEach(clinicianId => {
        Object.keys(storedData[clinicianId]).forEach(day => {
          const slots = storedData[clinicianId][day as DayOfWeek];
          const filteredSlots = slots.filter(slot => slot.id !== slotId);
          
          if (filteredSlots.length !== slots.length) {
            storedData[clinicianId][day as DayOfWeek] = filteredSlots;
            deleted = true;
          }
        });
      });
      
      if (deleted) {
        this.saveDataToStorage(storedData);
      }
      
      return deleted;
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      return false;
    }
  }
  
  /**
   * Get settings for a clinician
   */
  async getSettingsForClinician(clinicianId: string) {
    const settings = this.getSettingsFromStorage();
    
    // If no settings exist for this clinician, generate default settings
    if (!settings[clinicianId]) {
      settings[clinicianId] = this.generateDefaultSettings();
      this.saveSettingsToStorage(settings);
    }
    
    return settings[clinicianId];
  }
  
  /**
   * Update settings for a clinician
   */
  async updateSettings(clinicianId: string, updates: any) {
    try {
      const settings = this.getSettingsFromStorage();
      
      // Initialize if not exists
      if (!settings[clinicianId]) {
        settings[clinicianId] = this.generateDefaultSettings();
      }
      
      // Update settings
      settings[clinicianId] = {
        ...settings[clinicianId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      this.saveSettingsToStorage(settings);
      return settings[clinicianId];
    } catch (error) {
      console.error('Error updating availability settings:', error);
      throw error;
    }
  }
  
  // Helper methods
  
  /**
   * Get data from local storage
   */
  private getDataFromStorage(): Record<string, WeeklyAvailability> {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting availability data from storage:', error);
      return {};
    }
  }
  
  /**
   * Save data to local storage
   */
  private saveDataToStorage(data: Record<string, WeeklyAvailability>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving availability data to storage:', error);
    }
  }
  
  /**
   * Get settings from local storage
   */
  private getSettingsFromStorage(): Record<string, any> {
    try {
      const storedData = localStorage.getItem(this.settingsKey);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting availability settings from storage:', error);
      return {};
    }
  }
  
  /**
   * Save settings to local storage
   */
  private saveSettingsToStorage(settings: Record<string, any>): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving availability settings to storage:', error);
    }
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `mock_avail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Generate sample availability data
   */
  private generateSampleAvailability(): WeeklyAvailability {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const availability: WeeklyAvailability = {} as WeeklyAvailability;
    
    days.forEach(day => {
      availability[day] = [
        {
          id: this.generateId(),
          startTime: '09:00',
          endTime: '12:00',
          isRecurring: true,
          isAppointment: false
        },
        {
          id: this.generateId(),
          startTime: '13:00',
          endTime: '17:00',
          isRecurring: true,
          isAppointment: false
        }
      ];
    });
    
    return availability;
  }
  
  /**
   * Generate default settings
   */
  private generateDefaultSettings() {
    return {
      id: this.generateId(),
      defaultSlotDuration: 60,
      minNoticeDays: 1,
      maxAdvanceDays: 30,
      timeZone: 'America/Chicago',
      slotDuration: 60,
      timeGranularity: 'hour',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export const mockAvailabilityService = new MockAvailabilityService();
export default mockAvailabilityService;
