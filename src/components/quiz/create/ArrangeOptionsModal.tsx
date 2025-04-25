
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableOption } from "./SortableOption";

interface ArrangeOptionsModalProps {
  isOpen: boolean;
  options: string[];
  onClose: () => void;
  onArrange: (newOrder: string[]) => void;
}

export function ArrangeOptionsModal({
  isOpen,
  options,
  onClose,
  onArrange,
}: ArrangeOptionsModalProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = options.indexOf(active.id);
      const newIndex = options.indexOf(over.id);
      const newOrder = arrayMove(options, oldIndex, newIndex);
      onArrange(newOrder);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <CardTitle className="mb-4">Arrange Options</CardTitle>
          <CardDescription className="mb-4">
            Drag and drop the options to set the order. The first option will be worth more points.
          </CardDescription>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={options}
              strategy={verticalListSortingStrategy}
            >
              {options.map((option, index) => (
                <SortableOption
                  key={option}
                  id={option}
                  option={option}
                  index={index}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <Button 
            onClick={onClose}
            className="w-full mt-4"
          >
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
