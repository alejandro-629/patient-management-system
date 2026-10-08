import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientForm } from '@/components/patients/patient-form';
import { emptyPatient } from '@/lib/validation';

describe('PatientForm', () => {
  it('blocks submit and explains what is missing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <PatientForm
        defaultValues={emptyPatient}
        submitLabel="Add patient"
        pending={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add patient' }));

    expect(
      await screen.findByText('First name is required'),
    ).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid record', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PatientForm
        defaultValues={emptyPatient}
        submitLabel="Add patient"
        pending={false}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'Ada@Example.com');
    await user.type(screen.getByLabelText('Phone'), '+1 555 0100');
    await user.type(screen.getByLabelText('Date of birth'), '1990-02-28');
    await user.click(screen.getByRole('button', { name: 'Add patient' }));

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '+1 555 0100',
      dob: '1990-02-28',
    });
  });
});
