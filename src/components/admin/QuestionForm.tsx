
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuestionFormProps {
  initialData?: {
    text: string;
    type: 'mcq' | 'number';
    options?: string[];
  };
  onSubmit: (data: {
    text: string;
    type: 'mcq' | 'number';
    options?: string[];
  }) => void;
  onCancel: () => void;
}

export const QuestionForm = ({ initialData, onSubmit, onCancel }: QuestionFormProps) => {
  const [text, setText] = useState(initialData?.text || '');
  const [type, setType] = useState<'mcq' | 'number'>(initialData?.type || 'mcq');
  const [options, setOptions] = useState<string[]>(initialData?.options || []);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (type === 'mcq' && options.length < 2) return;

    onSubmit({
      text: text.trim(),
      type,
      options: type === 'mcq' ? options : undefined,
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

      <div>
        <Label>Question Type</Label>
        <Select value={type} onValueChange={(value: 'mcq' | 'number') => setType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mcq">Multiple Choice</SelectItem>
            <SelectItem value="number">Number</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'mcq' && (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add option"
            />
            <Button type="button" onClick={handleAddOption}>
              Add
            </Button>
          </div>

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
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Question</Button>
      </div>
    </div>
  );
};
