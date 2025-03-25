
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Add a small delay before redirecting to allow the component to render
    const redirectTimer = setTimeout(() => {
      navigate('/calendar');
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <Layout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to ValorWell EHR</h1>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
