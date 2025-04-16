
// Points assigned based on position (1st choice = 4 points, 4th choice = 1 point)
export const getPointsForPosition = (position: number): number => {
  return 5 - position; // 1st -> 4, 2nd -> 3, 3rd -> 2, 4th -> 1
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

// Calculate aura points for number type questions
export const calculateNumberAuraPoints = (value: number): number => {
  // Normalize number inputs to a 1-4 point scale
  if (value <= 0) return 0;
  if (value <= 25) return 1;
  if (value <= 50) return 2;
  if (value <= 75) return 3;
  return 4;
};
