import React from "react";

export function EmptyState({
  icon = "◌",
  title = "No Data Found",
  description = "Connect your wallet or perform an action to get started.",
  actionText,
  onAction,
  type = "default",
  docsHint,
}) {
  return (
    <div className={`empty-state-card empty-state-${type}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {docsHint && <div className="empty-state-hint">{docsHint}</div>}
      {actionText && onAction && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
