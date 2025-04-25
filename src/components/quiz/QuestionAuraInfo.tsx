
interface QuestionAuraInfoProps {
  type: 'mcq' | 'number';
}

export function QuestionAuraInfo({ type }: QuestionAuraInfoProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-semibold mb-2">Aura Points Calculation</h4>
      <p className="text-sm text-gray-600">
        {type === 'mcq' 
          ? 'Options are weighted based on their position: 1st choice = 4 points, 2nd = 3 points, 3rd = 2 points, 4th = 1 point.'
          : 'Input values between 1-5 contribute proportionally to your aura points (e.g., answering 4 gives you 8,000 points).'}
      </p>
    </div>
  );
}
