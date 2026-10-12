import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl border border-dashed border-slate-300">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 heading-font">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-slate-500 max-w-md">{description}</p>}
      {actionText && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} icon={actionIcon}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
