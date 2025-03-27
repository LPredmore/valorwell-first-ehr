
import React, { useState } from 'react';
import { Pencil, Trash, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';

const TemplatesTab = () => {
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);

  return (
    <div className="p-6 animate-fade-in">
      {showTreatmentPlanTemplate ? (
        <TreatmentPlanTemplate onClose={() => setShowTreatmentPlanTemplate(false)} />
      ) : showSessionNoteTemplate ? (
        <SessionNoteTemplate onClose={() => setShowSessionNoteTemplate(false)} />
      ) : (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart Templates</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800">
                <Plus size={16} />
                <span>Add Template</span>
              </button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowTreatmentPlanTemplate(true)}>
                    <TableCell className="font-medium">Treatment Plan</TableCell>
                    <TableCell>Chart Template</TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowSessionNoteTemplate(true)}>
                    <TableCell className="font-medium">Session Note</TableCell>
                    <TableCell>Chart Template</TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Online Forms</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                <Plus size={16} />
                <span>Add Form</span>
              </button>
            </div>
            
            <div className="text-center py-10 border rounded bg-gray-50 text-gray-500">
              No online forms available. Click the button above to create your first form.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplatesTab;
