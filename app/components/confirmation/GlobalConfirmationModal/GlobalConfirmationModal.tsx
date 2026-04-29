"use client";

import React from "react";
import BaseModal from "@/app/components/modals/BaseModal/BaseModal";
import { Button } from "@/app/components/ui/Button/Button";
import { useConfirmation } from "@/lib/context/ConfirmationContext";

export default function GlobalConfirmationModal() {
  const { isOpen, closeConfirmation, options, isLoading, setLoading } = useConfirmation();

  if (!options) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await options.onConfirm();
      closeConfirmation();
    } catch (error) {
      console.error("Confirmation error:", error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    closeConfirmation();
  };

  const variantStyles = {
    danger: "danger" as const,
    warning: "primary" as const,
    info: "secondary" as const,
    primary: "primary" as const,
  };

  const buttonVariant = variantStyles[options.variant || "primary"];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={options.title}
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      <div className="space-y-4">
        <p className="text-gray-700" style={{ color: "var(--color-text-secondary)" }}>
          {options.message}
        </p>
        <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-md)", marginTop: "var(--spacing-lg)" }}>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label={options.cancelText || "Cancel"}
          >
            {options.cancelText || "Cancel"}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={options.confirmText || "Confirm"}
          >
            {isLoading ? "Processing..." : (options.confirmText || "Confirm")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
