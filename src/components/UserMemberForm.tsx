
import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface UserMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

const UserMemberForm = ({ isOpen, onClose }: UserMemberFormProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>User Member Functionality Removed</SheetTitle>
        </SheetHeader>
        
        <div className="flex items-center justify-center h-64">
          <p className="text-center text-gray-600">
            User member creation and editing functionality has been removed.
          </p>
        </div>
        
        <SheetFooter>
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default UserMemberForm;
