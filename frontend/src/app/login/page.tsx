import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main
      id="main"
      className="flex flex-1 items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold tracking-tight">
          Patients
        </p>
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use your clinic account to open patient records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-4 text-center text-xs leading-5">
          Demo admin: admin@demo.com / Admin123!
          <br />
          Demo user: user@demo.com / User123!
        </p>
      </div>
    </main>
  );
}
