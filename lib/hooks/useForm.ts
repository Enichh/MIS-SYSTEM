'use client';

import { useState, useCallback } from 'react';
import { validateField } from '@/lib/utils/validation';
import type { FormFieldConfig } from '@/types';

interface UseFormOptions<T> {
  fields: FormFieldConfig[];
  initialValues: T;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
}

interface UseFormReturn<T> {
  formData: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  notification: { type: 'success' | 'error'; message: string } | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useForm<T extends object>({
  fields,
  initialValues,
  onSubmit,
  onSuccess,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const value = String(formData[field.name as keyof T] || '');
      const validation = validateField(value, field);
      if (!validation.isValid) {
        newErrors[field.name] = validation.error || 'Invalid field';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, formData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setNotification({ type: 'success', message: 'Operation completed successfully!' });
      setErrors({});
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, onSubmit, onSuccess]);

  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setNotification(null);
  }, [initialValues]);

  return {
    formData,
    errors,
    isSubmitting,
    notification,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
}
