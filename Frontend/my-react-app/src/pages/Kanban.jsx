import React from 'react';
import KanbanBoard from "./KanbanBoard";
import TopBar from "../components/Topbar";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
const Kanban = ({ projectName }) => {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <TopBar projectName={projectName} />
      <KanbanBoard />
    </div>
  );
};
export default Kanban;
