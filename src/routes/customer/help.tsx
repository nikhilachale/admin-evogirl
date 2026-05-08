import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/shared/logo';

export function HelpPage() {
  return (
    <div className="mx-auto max-w-md p-6">
      <div className="mb-8 flex justify-center">
        <Logo variant="light" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Need help with your order?</CardTitle>
          <CardDescription>
            Find your purchase, raise a claim, or browse care guides.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* TODO: customer entry points — order lookup, FAQ, raise ticket */}
          <p className="text-sm text-muted-foreground">Customer flow TODO.</p>
        </CardContent>
      </Card>
    </div>
  );
}
