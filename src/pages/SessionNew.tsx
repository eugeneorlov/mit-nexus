import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreateSessionForm } from '@/components/sessions/CreateSessionForm';

export default function SessionNew() {
  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link
        to="/sessions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-navy-light mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-navy-light">New Session</CardTitle>
          <CardDescription>
            Create a breakout session for your cohort.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSessionForm />
        </CardContent>
      </Card>
    </div>
  );
}
