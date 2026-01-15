import KanbanColumn from "../components/KanbanColumn";
import { kanbanData } from "../data/mockData";


export default function Board() {
return (
<div className="flex gap-6 p-6 overflow-x-auto">
{kanbanData.map(col => (
<KanbanColumn key={col.id} column={col} />
))}
</div>
);
}