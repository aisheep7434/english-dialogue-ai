'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { Dialogue } from '@/types';

interface DialogueHistoryItemProps {
  dialogue: { id: string; title: string };
  isSelected: boolean;
  onClick: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

export default function DialogueHistoryItem({
  dialogue,
  isSelected,
  onClick,
  onRename,
  onDelete,
}: DialogueHistoryItemProps) {
  const handleClick = () => {
    onClick(dialogue.id);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt('请输入新的标题:', dialogue.title);
    if (newTitle && newTitle.trim() && newTitle !== dialogue.title) {
      onRename?.(dialogue.id, newTitle.trim());
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个对话吗？')) {
      onDelete?.(dialogue.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`nav-item group ${isSelected ? 'selected' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="truncate flex-1 text-sm">{dialogue.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRename && (
            <button
              onClick={handleRename}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="重命名"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}