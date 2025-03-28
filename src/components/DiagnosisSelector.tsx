
import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useICD10Codes } from '@/hooks/useICD10Codes';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface DiagnosisSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function DiagnosisSelector({ value = [], onChange, placeholder = "Search for diagnosis..." }: DiagnosisSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { codes, loading } = useICD10Codes(searchTerm);

  const handleSelect = (code: string) => {
    if (!value.includes(code)) {
      onChange([...value, code]);
    }
    setSearchTerm('');
  };

  const handleRemove = (codeToRemove: string) => {
    onChange(value.filter(code => code !== codeToRemove));
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((code) => (
          <Badge key={code} variant="secondary" className="flex items-center gap-1">
            {code}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => handleRemove(code)}
            />
          </Badge>
        ))}
      </div>
      
      <Command className="border rounded-md">
        <CommandInput 
          placeholder={placeholder} 
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        {searchTerm && (
          <CommandList>
            {loading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : codes.length === 0 ? (
              <CommandEmpty>No diagnoses found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {codes.map((code) => (
                  <CommandItem
                    key={code.id}
                    value={code.diagnosis_name}
                    onSelect={() => handleSelect(code.icd10)}
                  >
                    <div className="flex justify-between w-full">
                      <span>{code.diagnosis_name}</span>
                      <span className="text-xs text-gray-500">{code.icd10}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
