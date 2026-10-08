'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { persistSession } from '@/lib/auth';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: 'Enter a valid email address' })),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (params.get('reason') === 'expired') {
      toast.warning('Your session expired. Sign in again.');
    }
  }, [params]);

  async function onSubmit(values: LoginValues) {
    setPending(true);
    try {
      const result = await api<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      persistSession(result.token);
      router.replace('/patients');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not reach the server';
      form.setError('root', { message });
    } finally {
      setPending(false);
    }
  }

  const rootError = form.formState.errors.root;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.email || undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
        <Field data-invalid={!!form.formState.errors.password || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
      </FieldGroup>
      {rootError && (
        <p role="alert" className="text-destructive text-sm">
          {rootError.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
