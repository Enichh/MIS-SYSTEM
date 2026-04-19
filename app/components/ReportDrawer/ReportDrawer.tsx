"use client";

import { useReportChat } from "@/lib/hooks/useReportChat";
import { TrashIcon } from "@/app/components/ui/icons/custom/TrashIcon";
import { Button } from "@/app/components/ui/Button/Button";
import { Input } from "@/app/components/ui/Input/Input";
import { MarkdownRenderer } from "@/app/components/MarkdownRenderer/MarkdownRenderer";
import { UserIcon } from "@/app/components/ui/icons/custom/UserIcon";
import { FolderIcon } from "@/app/components/ui/icons/custom/FolderIcon";
import { CheckIcon } from "@/app/components/ui/icons/custom/CheckIcon";
import { BarChartIcon } from "@/app/components/ui/icons/custom/BarChartIcon";
import type { ReportType } from "@/lib/types/reports";
import { ReportPDF } from "./ReportPDF";
import "./ReportDrawer.css";

const quickReportTypes: {
  type: ReportType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "employee_summary",
    label: "Employee Summary",
    icon: <UserIcon size={16} />,
  },
  {
    type: "project_status",
    label: "Project Status",
    icon: <FolderIcon size={16} />,
  },
  {
    type: "task_overview",
    label: "Task Overview",
    icon: <CheckIcon size={16} />,
  },
  {
    type: "workload_analysis",
    label: "Workload Analysis",
    icon: <BarChartIcon size={16} />,
  },
];

export function ReportDrawer() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    currentReport,
    messagesEndRef,
    handleSend,
    handleKeyDown,
    handleClearHistory,
    formatTimestamp,
    isMessageValid,
    MAX_MESSAGE_LENGTH,
    generateQuickReport,
    reload,
    includeFullDetails,
    setIncludeFullDetails,
  } = useReportChat();

  return (
    <div className="report-drawer">
      <div className="chat-modal-header report-drawer-header">
        <h3>AI Reports Assistant</h3>
        <div className="report-drawer-header-actions">
          <div className="report-detail-toggle">
            <label className="report-toggle-label">
              <input
                type="checkbox"
                checked={includeFullDetails}
                onChange={(e) => setIncludeFullDetails(e.target.checked)}
                className="report-toggle-checkbox"
                disabled={isLoading}
              />
              <span className="report-toggle-text">Full Details</span>
            </label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            aria-label="Clear report history"
            className="chat-modal-delete"
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      </div>

      <div className="chat-message-list-container">
        <div className="chat-message-list">
          {messages.length === 0 && !isLoading ? (
            <div className="chat-message-empty">
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-content">
                  <MarkdownRenderer content="Hello! I'm your AI Reports Assistant. I can help you generate comprehensive reports about employees, projects, tasks, and workload analysis. Select a quick report type below to get started." />
                </div>
              </div>

              <div className="report-quick-actions">
                <p className="report-quick-actions-title">
                  Quick Report Types:
                </p>
                <div className="report-quick-actions-grid">
                  {quickReportTypes.map(({ type, label, icon }) => (
                    <button
                      key={type}
                      className="report-quick-action-btn"
                      onClick={() => generateQuickReport(type)}
                      disabled={isLoading}
                      aria-label={`Generate ${label} report`}
                    >
                      <span className="report-quick-action-icon">{icon}</span>
                      <span className="report-quick-action-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.role === "user" ? "chat-message-user" : "chat-message-assistant"}`}
              >
                <div className="chat-message-content">
                  {msg.role === "assistant" ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
                <div className="chat-message-meta">
                  <span className="chat-message-timestamp">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}

          {currentReport && (
            <div className="report-preview">
              <div className="report-preview-header">
                <h4 className="report-preview-title">{currentReport.title}</h4>
                <div className="report-preview-actions">
                  <span className="report-preview-type">
                    {currentReport.type}
                  </span>
                  <ReportPDF data={currentReport} />
                </div>
              </div>
              <div className="report-preview-meta">
                <span>
                  Generated:{" "}
                  {new Date(currentReport.generatedAt).toLocaleString()}
                </span>
              </div>
              {currentReport.metrics.length > 0 && (
                <div className="report-preview-metrics">
                  {currentReport.metrics.map((metric, index) => (
                    <div key={index} className="report-preview-metric">
                      <span className="report-preview-metric-label">
                        {metric.label}
                      </span>
                      <span className="report-preview-metric-value">
                        {metric.value}
                        {metric.unit && (
                          <span className="report-preview-metric-unit">
                            {metric.unit}
                          </span>
                        )}
                      </span>
                      {metric.trend && (
                        <span
                          className={`report-preview-metric-trend report-preview-metric-trend-${metric.trend}`}
                        >
                          {metric.trend === "up"
                            ? "↑"
                            : metric.trend === "down"
                              ? "↓"
                              : "→"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="chat-message-loading">
              <div className="loading-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {error && (
            <div className="chat-message-error" role="alert">
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reload?.()}
                aria-label="Retry last message"
              >
                Retry
              </Button>
            </div>
          )}

          <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
        </div>
      </div>
    </div>
  );
}
