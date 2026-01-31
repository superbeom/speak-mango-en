"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Expression } from "@/types/expression";
import ExpressionCard from "@/components/ExpressionCard";
import VocabularyEmptyState from "@/components/me/VocabularyEmptyState";

interface VocabularyItemsGridProps {
  items: Expression[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const VocabularyItemsGrid = memo(function VocabularyItemsGrid({
  items,
}: VocabularyItemsGridProps) {
  if (items.length === 0) {
    return <VocabularyEmptyState />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
    >
      {items.map((item) => (
        <ExpressionCard key={item.id} item={item} />
      ))}
    </motion.div>
  );
});

VocabularyItemsGrid.displayName = "VocabularyItemsGrid";

export default VocabularyItemsGrid;
