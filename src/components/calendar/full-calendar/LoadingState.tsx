
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const LoadingState: React.FC = () => {
  return (
    <Card className="p-4 flex justify-center items-center h-[300px]">
      <Loader2 className="h-6 w-6 animate-spin" />
    </Card>
  );
};

export default LoadingState;
