
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';

const Home = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-6">Welcome to Therapy Calendar</h1>
        <p className="text-lg text-center text-gray-600 mb-8 max-w-2xl">
          Efficiently manage appointments, availability, and client interactions with our comprehensive scheduling system.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button asChild size="lg">
            <Link to="/calendar">
              <CalendarClock className="mr-2" />
              Go to Calendar
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/clients">View Clients</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
