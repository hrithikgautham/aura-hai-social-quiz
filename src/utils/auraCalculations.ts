// Modify getPointsForPosition to assign points based on priority:
// 1st choice = 10000 points
// 2nd choice = 6000 points
// 3rd choice = 3000 points
// 4th choice = 0 points
export const getPointsForPosition = (position: number): number => {
  switch (position) {
    case 1:
      return 10000;
    case 2:
      return 6000;
    case 3:
      return 3000;
    default:
      return 0;
  }
};
// Calculate points for number-type questions based on the user's answer
export const calculateNumberAuraPoints = (userAnswer: number, maxPoints: number = 10000): number => {
  const normalizedAnswer = Math.min(5, Math.max(0, userAnswer));
  return (normalizedAnswer / 5) * maxPoints;
};

// Calculate aura points based on MCQ priority order
export const calculateMCQAuraPoints = (priorityOrder: string[] | any): number => {
  // If priorityOrder is a string, try to parse it
  let parsedOrder = priorityOrder;
  if (typeof priorityOrder === 'string') {
    try {
      parsedOrder = JSON.parse(priorityOrder);
    } catch (error) {
      console.error('Error parsing priority order:', error);
      return 0; // Return 0 points if we can't parse
    }
  }
  
  if (!Array.isArray(parsedOrder)) {
    return 0;
  }
  
  let totalPoints = 0;
  parsedOrder.forEach((_, index) => {
    totalPoints += getPointsForPosition(index + 1);
  });
  return totalPoints;
};

// Add the auraColors export
export const auraColors: Record<string, string> = {
  'red': '#FF0000',
  'orange': '#FFA500',
  'yellow': '#FFFF00',
  'green': '#00FF00',
  'blue': '#0000FF',
  'purple': '#800080',
  // Ensure lowercase keys match what's used in QuizAnalytics.tsx
  'Red': '#FF0000',
  'Orange': '#FFA500',
  'Yellow': '#FFFF00',
  'Green': '#00FF00',
  'Blue': '#0000FF',
  'Purple': '#800080'
};
