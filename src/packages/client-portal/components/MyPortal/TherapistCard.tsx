import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TherapistCardProps } from './types';

const TherapistCard: React.FC<TherapistCardProps> = ({
  clinicianData,
  clinicianName,
  showBookingButtons,
  onBookAppointment,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Therapist</CardTitle>
        {showBookingButtons && (
          <Button variant="outline" size="sm" onClick={onBookAppointment}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Book New Appointment
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {clinicianData ? (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="flex flex-row gap-6 items-start">
              <Avatar className="h-48 w-48 border-2 border-white shadow-md rounded-md flex-shrink-0">
                {clinicianData.clinician_image_url ? (
                  <AvatarImage 
                    src={clinicianData.clinician_image_url} 
                    alt={clinicianName || 'Therapist'} 
                    className="object-cover h-full w-full" 
                  />
                ) : (
                  <AvatarFallback className="text-4xl font-medium bg-valorwell-100 text-valorwell-700 h-full w-full">
                    {clinicianData.clinician_first_name?.[0] || ''}
                    {clinicianData.clinician_last_name?.[0] || ''}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1">
                {clinicianData.clinician_bio && (
                  <>
                    <h4 className="font-medium text-lg mb-2">About {clinicianName}</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-line">
                      {clinicianData.clinician_bio}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">No Assigned Therapist</h3>
            <p className="text-sm text-gray-500 mt-1">
              You don't have an assigned therapist yet. Please contact the clinic for assistance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TherapistCard;
