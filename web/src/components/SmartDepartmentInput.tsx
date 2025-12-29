import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  getDepartmentSuggestions,
  searchDepartments,
  saveDepartmentToHistory,
  removeDepartmentFromHistory,
} from '@/utils/departmentHistory';

interface SmartDepartmentInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SmartDepartmentInput({
  value,
  onChange,
  placeholder = "Select or type department name",
  className,
  disabled = false,
  required = false,
}: SmartDepartmentInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Load initial suggestions
  useEffect(() => {
    setSuggestions(getDepartmentSuggestions());
  }, []);

  const handleInputChange = (searchValue: string) => {
    setInputValue(searchValue);
    onChange(searchValue);

    // Update suggestions based on search
    if (searchValue.trim()) {
      setSuggestions(searchDepartments(searchValue));
    } else {
      setSuggestions(getDepartmentSuggestions());
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setOpen(false);

    // Save to history when selected
    saveDepartmentToHistory(suggestion);
  };

  const handleCreateNew = () => {
    if (inputValue.trim()) {
      // Save new department to history
      saveDepartmentToHistory(inputValue.trim());
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !filteredSuggestions.some(s => s.toLowerCase() === inputValue.toLowerCase())) {
      e.preventDefault();
      handleCreateNew();
    }
  };

  const handleRemoveSuggestion = (suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeDepartmentFromHistory(suggestion);
    // Refresh suggestions
    setSuggestions(getDepartmentSuggestions());
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateNew = inputValue.trim() &&
    !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className={cn(
            "truncate",
            !inputValue && "text-muted-foreground"
          )}>
            {inputValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search departments..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            required={required}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <div className="py-6 text-center text-sm">
                  No departments found.
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1"
                    onClick={handleCreateNew}
                  >
                    Create "{inputValue.trim()}"
                  </Button>
                </div>
              ) : (
                "No department history yet. Start typing to add departments."
              )}
            </CommandEmpty>

            {filteredSuggestions.length > 0 && (
              <CommandGroup heading="Recent Departments">
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          inputValue === suggestion ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{suggestion}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                      onClick={(e) => handleRemoveSuggestion(suggestion, e)}
                      title="Remove from history"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showCreateNew && (
              <CommandGroup heading="Create New">
                <CommandItem
                  value={inputValue}
                  onSelect={handleCreateNew}
                  className="flex items-center"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span>Create "{inputValue.trim()}"</span>
                  <Badge variant="secondary" className="ml-auto">
                    New
                  </Badge>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}