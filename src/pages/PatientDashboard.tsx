
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';

const PatientDashboard: React.FC = () => {
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageId, setMessageId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userId, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !userId) {
      toast({
        title: "Access restricted",
        description: "Please sign in to view the dashboard",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [userId, isUserLoading, navigate, toast]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      if (userData?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setError(error.message);
        } else {
          setProfile(data);
        }
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.functions.invoke('twilio-send-message', {
        body: {
          to: phoneNumber,
          message: message,
        },
      });

      if (error) throw error;

      // Set the messageId directly if data is a string, otherwise handle the object structure
      setMessageId(typeof data === 'string' ? data : data?.messageId || '');
      setMessage('');
      setIsSuccess(true);

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>

      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {profile.full_name}!</CardTitle>
            <CardDescription>Manage your profile and communication settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Email: {profile.email}</p>
            <p>Phone: {profile.phone || 'Not provided'}</p>
          </CardContent>
        </Card>
      ) : (
        <p>Loading profile...</p>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Send SMS Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              required
            />
          </div>
          <Button type="submit">Send Message</Button>
        </form>

        {isSuccess && messageId && (
          <div className="mt-4">
            <p className="text-green-500">Message sent successfully!</p>
            <p>Message ID: {messageId}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientDashboard;
