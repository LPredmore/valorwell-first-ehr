
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientDetails } from '@/types/client';

interface MyPortalProps {
  upcomingAppointments: any[];
  clientData: ClientDetails | null;
  clinicianName: string | null;
  loading: boolean;
}

const MyPortal: React.FC<MyPortalProps> = ({ 
  upcomingAppointments, 
  clientData, 
  clinicianName, 
  loading 
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Welcome to Your Patient Portal</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <p className="text-gray-600">
                Hello, {clientData?.client_preferred_name || clientData?.client_first_name || 'Patient'}! 
                This is your personal portal to manage your healthcare journey.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Therapist Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Your Therapist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : clientData?.client_assigned_therapist ? (
              <div>
                <p className="font-medium">{clinicianName || 'Your Therapist'}</p>
                <p className="text-sm text-gray-500">
                  Contact your therapist through secure messaging or by scheduling an appointment.
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No therapist assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div>
                <p className="font-medium">
                  {formatDate(upcomingAppointments[0].date)}
                </p>
                <p className="text-sm text-gray-500">
                  {upcomingAppointments[0].start_time} - {upcomingAppointments[0].end_time}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No upcoming appointments scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Portal Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Portal Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <User className="h-5 w-5 mr-3 mt-1 text-valorwell-500" />
              <div>
                <h3 className="font-medium">Profile</h3>
                <p className="text-sm text-gray-500">View and update your personal information</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-3 mt-1 text-valorwell-500" />
              <div>
                <h3 className="font-medium">Appointments</h3>
                <p className="text-sm text-gray-500">Schedule and manage your appointments</p>
              </div>
            </div>
            <div className="flex items-start">
              <Clock className="h-5 w-5 mr-3 mt-1 text-valorwell-500" />
              <div>
                <h3 className="font-medium">Past Appointments</h3>
                <p className="text-sm text-gray-500">View your appointment history</p>
              </div>
            </div>
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-3 mt-1 text-valorwell-500" />
              <div>
                <h3 className="font-medium">Documents</h3>
                <p className="text-sm text-gray-500">Access your reports and documents</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPortal;
