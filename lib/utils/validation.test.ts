import { describe, it, expect } from 'vitest';
import { validateField, MODAL_SIZES, DEFAULT_ANIMATION_DURATION, MODAL_Z_INDEX } from './validation';
import type { FormFieldConfig } from '@/types';

describe('validation utilities', () => {
  describe('MODAL_SIZES', () => {
    it('should have correct size values', () => {
      expect(MODAL_SIZES.sm).toBe(384);
      expect(MODAL_SIZES.md).toBe(448);
      expect(MODAL_SIZES.lg).toBe(512);
      expect(MODAL_SIZES.xl).toBe(576);
    });
  });

  describe('DEFAULT_ANIMATION_DURATION', () => {
    it('should be 300ms', () => {
      expect(DEFAULT_ANIMATION_DURATION).toBe(300);
    });
  });

  describe('MODAL_Z_INDEX', () => {
    it('should be 1000', () => {
      expect(MODAL_Z_INDEX).toBe(1000);
    });
  });

  describe('validateField', () => {
    const textConfig: FormFieldConfig = {
      name: 'test',
      label: 'Test Field',
      type: 'text',
      required: true,
    };

    const emailConfig: FormFieldConfig = {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    };

    const numberConfig: FormFieldConfig = {
      name: 'age',
      label: 'Age',
      type: 'number',
      required: true,
      min: 0,
      max: 120,
    };

    it('should pass validation for valid required field', () => {
      const result = validateField('valid value', textConfig);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for empty required field', () => {
      const result = validateField('', textConfig);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Test Field is required');
    });

    it('should pass validation for optional field with empty value', () => {
      const optionalConfig: FormFieldConfig = { ...textConfig, required: false };
      const result = validateField('', optionalConfig);
      expect(result.isValid).toBe(true);
    });

    it('should validate email format', () => {
      const validEmail = validateField('test@example.com', emailConfig);
      expect(validEmail.isValid).toBe(true);

      const invalidEmail = validateField('invalid-email', emailConfig);
      expect(invalidEmail.isValid).toBe(false);
      expect(invalidEmail.error).toBe('Email must be a valid email address');
    });

    it('should validate number field', () => {
      const validNumber = validateField('25', numberConfig);
      expect(validNumber.isValid).toBe(true);

      const invalidNumber = validateField('not a number', numberConfig);
      expect(invalidNumber.isValid).toBe(false);
      expect(invalidNumber.error).toBe('Age must be a valid number');
    });

    it('should validate number min constraint', () => {
      const result = validateField('-5', numberConfig);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Age must be at least 0');
    });

    it('should validate number max constraint', () => {
      const result = validateField('150', numberConfig);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Age must not exceed 120');
    });

    it('should validate minLength constraint', () => {
      const config: FormFieldConfig = {
        name: 'password',
        label: 'Password',
        type: 'text',
        required: true,
        minLength: 8,
      };
      const result = validateField('short', config);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });

    it('should validate maxLength constraint', () => {
      const config: FormFieldConfig = {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        maxLength: 20,
      };
      const result = validateField('this-username-is-way-too-long', config);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username must not exceed 20 characters');
    });

    it('should validate pattern constraint', () => {
      const config: FormFieldConfig = {
        name: 'phone',
        label: 'Phone',
        type: 'text',
        required: true,
        pattern: '^[0-9]{10}$',
      };
      const result = validateField('invalid-phone', config);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Phone format is invalid');
    });

    it('should sanitize input by trimming whitespace', () => {
      const result = validateField('  valid value  ', textConfig);
      expect(result.isValid).toBe(true);
    });
  });
});
