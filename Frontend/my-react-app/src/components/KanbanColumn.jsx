import { Droppable, Draggable } from "@hello-pangea/dnd";

export default function KanbanColumn({ column }) {
  return (
    <Droppable droppableId={column.id}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="
            w-[280px]
            bg-[#121212]
            rounded-3xl
            p-6
            flex flex-col
            shadow-2xl
            hover:shadow-3xl
            transition-all
            flex-shrink-0
          "
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-100 tracking-wide">
              {column.title}
            </h3>
            <span className="text-sm bg-[#1e1e1e] px-3 py-1 rounded-full text-gray-300 font-medium">
              {column.tasks.length}
            </span>
          </div>

          {/* Tasks */}
          <div className="flex flex-col gap-5 flex-1">
            {column.tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                      w-full
                      h-[120px]
                      bg-gradient-to-br from-[#1e1e1e] to-[#252525]
                      border-2 border-[#2f2f2f]
                      rounded-3xl
                      px-5
                      py-5
                      flex flex-col
                      justify-center
                      text-sm
                      text-gray-100
                      font-medium
                      leading-tight
                      hover:border-[#404040]
                      hover:shadow-2xl
                      hover:scale-[1.02]
                      transition-all duration-200
                      cursor-grab
                      ${snapshot.isDragging 
                        ? "shadow-3xl scale-[1.05] border-[#404040] opacity-90" 
                        : ""
                      }
                    `}
                  >
                    {task.title}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
