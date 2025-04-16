
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuestionFormProps {
  initialData?: {
    text: string;
    options?: string[];
  };
  onSubmit: (data: {
    text: string;
    options: string[];
  }) => void;
  onCancel: () => void;
  isReplacingDeactivated?: boolean;
  questionCount?: {
    fixed: number;
    custom: number;
  };
  isFixedQuestion?: boolean;
}

export const QuestionForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isReplacingDeactivated = false,
  questionCount = { fixed: 0, custom: 0 },
  isFixedQuestion = false
}: QuestionFormProps) => {
  const [text, setText] = useState(initialData?.text || '');
  const [options, setOptions] = useState<string[]>(initialData?.options || []);
  const [newOption, setNewOption] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check question limits
  useEffect(() => {
    if (isFixedQuestion && questionCount.fixed >= 7 && !initialData && !isReplacingDeactivated) {
      setError('Maximum 7 fixed questions allowed. Please deactivate a question first.');
    } else if (!isFixedQuestion && questionCount.custom >= 10 && !initialData && !isReplacingDeactivated) {
      setError('Maximum 10 custom questions allowed. Please deactivate a question first.');
    } else {
      setError(null);
    }
  }, [isFixedQuestion, questionCount, initialData, isReplacingDeactivated]);

  const handleAddOption = () => {
    if (options.length >= 4) {
      setError('Maximum 4 options allowed');
      return;
    }

    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
      setError(null);
    } else if (newOption.trim() === '') {
      setError('Option text cannot be empty');
    } else if (options.includes(newOption.trim())) {
      setError('Option already exists');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = () => {
    // Check for limits again before submitting
    if (isFixedQuestion && questionCount.fixed >= 7 && !initialData && !isReplacingDeactivated) {
      setError('Maximum 7 fixed questions allowed. Please deactivate a question first.');
      return;
    } else if (!isFixedQuestion && questionCount.custom >= 10 && !initialData && !isReplacingDeactivated) {
      setError('Maximum 10 custom questions allowed. Please deactivate a question first.');
      return;
    }

    if (!text.trim()) {
      setError('Question text is required');
      return;
    }
    
    // Require exactly 4 options
    if (options.length !== 4) {
      setError('Exactly 4 options are required');
      return;
    }

    onSubmit({
      text: text.trim(),
      options,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Question Text</Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter question text"
        />
      </div>

      <div className="space-y-2">
        <Label>Options (Exactly 4 options required)</Label>
        <div className="flex gap-2">
          <Input
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Add option"
            disabled={options.length >= 4}
          />
          <Button 
            type="button" 
            onClick={handleAddOption}
            disabled={options.length >= 4}
          >
            Add
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"
            >
              <span>{option}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => handleRemoveOption(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={(isFixedQuestion && questionCount.fixed >= 7 && !initialData && !isReplacingDeactivated) || 
                   (!isFixedQuestion && questionCount.custom >= 10 && !initialData && !isReplacingDeactivated)}
        >
          {isReplacingDeactivated ? "Replace Deactivated Question" : "Save Question"}
        </Button>
      </div>
    </div>
  );
};
