import React from 'react';
import { cn } from '@/lib/utils';
import { FAQCategory } from '@/types/faq';

interface FAQCategoryCardProps {
  category: FAQCategory;
  isActive: boolean;
  onClick: (key: FAQCategory['key']) => void;
}

const FAQCategoryCard: React.FC<FAQCategoryCardProps> = ({ category, isActive, onClick }) => {
  const Icon = category.icon;
  return (
    <div
      onClick={() => onClick(category.key)}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all duration-200",
        "hover:shadow-md",
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card text-foreground border-border hover:bg-muted/50"
      )}
    >
      <Icon className={cn("h-8 w-8 mb-2", isActive ? "text-primary-foreground" : "text-primary")} />
      <span className={cn("text-sm font-medium text-center", isActive ? "text-primary-foreground" : "text-foreground")}>
        {category.title}
      </span>
    </div>
  );
};

export default FAQCategoryCard;