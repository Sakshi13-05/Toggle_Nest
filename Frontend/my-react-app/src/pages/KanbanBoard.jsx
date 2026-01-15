import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "../components/KanbanColumn";
import { kanbanData } from "../data/mockData";

export default function KanbanBoard() {
  const onDragEnd = () => {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-[#0a0a0a] p-12 overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-20 min-w-max">
          {kanbanData.slice(0, 4).map((col) => (
            <KanbanColumn key={col.id} column={col} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
