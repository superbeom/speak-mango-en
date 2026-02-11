import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Star, MoreVertical } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { useConfirm } from "@/context/ConfirmContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VocabularyDetailHeaderProps {
  title: string;
  itemCount: number;
  isDefault?: boolean;
  onTitleSave?: (newTitle: string) => void;
  onListDelete?: () => void;
  onSetDefault?: () => void;
  className?: string;
  readonly?: boolean;
}

export default function VocabularyDetailHeader({
  title,
  itemCount,
  isDefault = false,
  onTitleSave,
  onListDelete,
  onSetDefault,
  className,
  readonly = false,
}: VocabularyDetailHeaderProps) {
  const { dict } = useI18n();
  const { confirm } = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const input = inputRef.current;
      // Ensure focus after animation/render
      requestAnimationFrame(() => {
        input.focus();
        input.select();
      });
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== title) {
      onTitleSave?.(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(title);
    }
  };

  const handleDelete = () => {
    confirm({
      title: dict.vocabulary.delete,
      description: dict.vocabulary.deleteConfirm,
      onConfirm: () => onListDelete?.(),
    });
  };

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 bg-transparent border-b-2 border-zinc-900 dark:border-zinc-50 outline-hidden px-0 py-1"
                    placeholder={dict.vocabulary.placeholder}
                  />
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={handleSave}
                      className="px-2.5 py-1.5 text-xs font-bold bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      {dict.common.save}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      {dict.common.cancel}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 min-w-0">
                  <motion.h1
                    key="display"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 truncate py-1"
                  >
                    {title}
                  </motion.h1>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums">
                    {itemCount.toLocaleString()}
                  </span>
                  {isDefault && (
                    <div
                      className="text-amber-400 shrink-0"
                      title={dict.vocabulary.default}
                    >
                      <Star size={20} fill="currentColor" />
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Dropdown */}
        {!readonly && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors cursor-pointer outline-hidden">
                    <MoreVertical size={20} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {!isDefault && onSetDefault && (
                    <DropdownMenuItem
                      onClick={onSetDefault}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-hidden dark:text-zinc-300 transition-colors"
                    >
                      <Star size={16} className="text-amber-400" />
                      {dict.vocabulary.setDefault}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={handleStartEdit}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 outline-hidden dark:text-zinc-300 transition-colors"
                  >
                    <Pencil size={16} />
                    {dict.common.edit}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 outline-hidden focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                    {dict.vocabulary.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
