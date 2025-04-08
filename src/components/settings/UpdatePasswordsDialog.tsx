
import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PasswordUpdateResult {
  id: string;
  email: string;
  success: boolean;
  error?: string;
}

interface PasswordUpdateResponse {
  success: boolean;
  message: string;
  results?: PasswordUpdateResult[];
  error?: string;
}

export const UpdatePasswordsDialog = () => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [results, setResults] = useState<PasswordUpdateResponse | null>(null);

  const handleUpdatePasswords = async () => {
    setIsUpdating(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-profile-passwords');
      
      if (error) {
        console.error('Error updating passwords:', error);
        toast({
          title: 'Error',
          description: 'Failed to update passwords. Please try again.',
          variant: 'destructive',
        });
        setResults({ success: false, message: error.message });
        return;
      }
      
      console.log('Password update results:', data);
      setResults(data as PasswordUpdateResponse);
      
      toast({
        title: 'Success',
        description: data.message || 'Passwords updated successfully',
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setResults({ success: false, message: 'An unexpected error occurred' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Update Missing Passwords</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Missing Passwords</DialogTitle>
          <DialogDescription>
            This will generate new temporary passwords for all profiles that don't have one.
          </DialogDescription>
        </DialogHeader>
        
        {!isUpdating && !results && (
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to continue? This will reset passwords for all users
              without a temporary password.
            </p>
          </div>
        )}
        
        {isUpdating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-valorwell-600" />
            <p className="ml-2">Updating passwords...</p>
          </div>
        )}
        
        {results && (
          <div className="py-2">
            <div className={`mb-4 p-3 rounded-md ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {results.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                    {results.message}
                  </p>
                </div>
              </div>
            </div>
            
            {results.results && results.results.length > 0 && (
              <ScrollArea className="h-60 rounded border p-2">
                <div className="space-y-2">
                  {results.results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded text-sm ${
                        result.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <p className="font-medium">{result.email || result.id}</p>
                      {result.success ? (
                        <p className="text-green-600">Password updated successfully</p>
                      ) : (
                        <p className="text-red-600">Error: {result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isUpdating}
          >
            Close
          </Button>
          {!results && (
            <Button 
              onClick={handleUpdatePasswords} 
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Update Passwords'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
