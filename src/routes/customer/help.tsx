import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/shared/logo';
import { TicketStatusLookup } from '@/components/customer/ticket-status-lookup';

export function HelpPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <Logo variant="light" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Help & claims
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track a claim, read answers, or jump to your products.
          </p>
        </div>
      </div>

      <TicketStatusLookup />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">More</CardTitle>
          <CardDescription>
            Self-serve links — no account required for the basics.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Link
            to="/help/faq"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            FAQ — claims, one ticket per product, response times
          </Link>
          <Link
            to="/help/my-products"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            My products
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
