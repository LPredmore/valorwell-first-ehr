
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type PasswordResult = {
  clinician_id: string;
  email: string;
  name?: string;
  success: boolean;
  action?: string;
  temp_password?: string;
  error?: string;
  message?: string;
  note?: string;
};

type RecoveryResponse = {
  message: string;
  results: PasswordResult[];
  total: number;
  success_count: number;
  error_count: number;
};

const RecoverClinicianPasswords = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RecoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecoverPasswords = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('recover-clinician-passwords');
      
      if (error) {
        throw error;
      }
      
      setResults(data as RecoveryResponse);
      toast({
        title: 'Password Recovery Complete',
        description: data.message,
      });
    } catch (err) {
      console.error('Error recovering passwords:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to recover clinician passwords',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Recover Clinician Passwords</h3>
        <p className="text-sm text-gray-500">
          This will generate and store new temporary passwords for all clinicians who don't have a stored password.
          No emails will be sent to users.
        </p>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRecoverPasswords}
            disabled={isLoading}
            className="mt-2"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Recover Missing Passwords
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {results && (
        <Card className="p-4 overflow-auto max-h-[500px]">
          <h4 className="font-medium mb-2">Results Summary</h4>
          <p className="mb-4">{results.message}</p>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temp Password
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.results.map((result, index) => (
                <tr key={index} className={!result.success ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.success ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {result.action === "skipped" ? "Already Set" : "Updated"}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Error: {result.error}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {result.temp_password || (result.action === "skipped" ? "(Existing password)" : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default RecoverClinicianPasswords;
