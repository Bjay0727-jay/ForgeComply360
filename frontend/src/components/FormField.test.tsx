import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders text input with label', () => {
    render(
      <FormField
        label="Username"
        name="username"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders textarea when type is textarea', () => {
    render(
      <FormField
        label="Description"
        name="description"
        type="textarea"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'description');
    // Textarea has the name
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('renders select with children options', () => {
    render(
      <FormField
        label="Country"
        name="country"
        type="select"
        value=""
        onChange={() => {}}
      >
        <option value="">Select...</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
      </FormField>
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test@example.com' } });

    expect(handleChange).toHaveBeenCalledWith('test@example.com');
  });

  it('shows required indicator asterisk', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error on blur for empty required field', () => {
    render(
      <FormField
        label="Name"
        name="name"
        value=""
        onChange={() => {}}
        required
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('shows error when custom validator fails', () => {
    const validate = (value: string) => {
      return value.includes('@') ? null : 'Must be a valid email';
    };

    render(
      <FormField
        label="Email"
        name="email"
        value="notanemail"
        onChange={() => {}}
        validate={validate}
      />
    );

    fireEvent.blur(screen.getByRole('textbox'));

    expect(screen.getByText('Must be a valid email')).toBeInTheDocument();
  });

  it('shows valid state (green border) for valid input', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value="valid@email.com"
        onChange={() => {}}
        required
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    // Check for green border class (indicating valid state)
    expect(input.className).toContain('border-green-500');
  });

  it('displays helpText when not in error state', () => {
    render(
      <FormField
        label="Password"
        name="password"
        type="password"
        value="securepassword"
        onChange={() => {}}
        helpText="Must be at least 8 characters"
      />
    );

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('sets aria-invalid and aria-describedby on error', () => {
    render(
      <FormField
        label="Email"
        name="email"
        value=""
        onChange={() => {}}
        required
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('hides helpText when error is shown', () => {
    render(
      <FormField
        label="Name"
        name="name"
        value=""
        onChange={() => {}}
        required
        helpText="Enter your full name"
      />
    );

    fireEvent.blur(screen.getByRole('textbox'));

    // Error should be shown instead of helpText
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your full name')).not.toBeInTheDocument();
  });
});
