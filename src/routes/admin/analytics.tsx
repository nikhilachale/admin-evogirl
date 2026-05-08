import { useState } from 'react';
import { ChartCard } from '@/components/admin/analytics/chart-card';
import { FunnelChart } from '@/components/admin/analytics/funnel-chart';
import { LanguageDistribution } from '@/components/admin/analytics/language-distribution';
import { PlatformBreakdown } from '@/components/admin/analytics/platform-breakdown';
import { ProductCallouts } from '@/components/admin/analytics/product-callouts';
import { ProductTable } from '@/components/admin/analytics/product-table';
import { RangeToggle } from '@/components/admin/analytics/range-toggle';
import { RegistrationsChart } from '@/components/admin/analytics/registrations-chart';
import { ReturnReasons } from '@/components/admin/analytics/return-reasons';
import { SentimentCard } from '@/components/admin/analytics/sentiment-card';
import { StatTile } from '@/components/admin/analytics/stat-tile';
import {
  MOCK_CALLOUTS,
  MOCK_DAILY_REGISTRATIONS,
  MOCK_FUNNEL,
  MOCK_LANGUAGES,
  MOCK_PLATFORMS,
  MOCK_PRODUCTS,
  MOCK_RETURN_REASONS,
  MOCK_SENTIMENT,
  MOCK_STATS,
} from '@/data/analytics.mock';
import type { AnalyticsRange, ProductSortKey } from '@/types/analytics';

export function AnalyticsPage() {
  // The prototype's range pills are visual-only — preserve that behavior here.
  const [range, setRange] = useState<AnalyticsRange>('30');
  const [sortBy, setSortBy] = useState<ProductSortKey>('reviews');

  return (
    <div className="p-8">
      <header className="mb-3.5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.18em] text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            promise.evogirl.com · All channels
          </p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {MOCK_STATS.map((stat) => (
          <StatTile key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Registrations — Daily" subtitle="Last 7 days">
          <RegistrationsChart data={MOCK_DAILY_REGISTRATIONS} />
        </ChartCard>
        <ChartCard title="Review → Voucher Funnel" subtitle="Conversion rates">
          <FunnelChart steps={MOCK_FUNNEL} />
        </ChartCard>
        <ChartCard title="Platform Breakdown" subtitle="Where customers register from">
          <PlatformBreakdown platforms={MOCK_PLATFORMS} />
        </ChartCard>
        <ChartCard title="Language Distribution" subtitle="Customer conversations">
          <LanguageDistribution languages={MOCK_LANGUAGES} />
        </ChartCard>
      </div>

      <ProductTable rows={MOCK_PRODUCTS} sortBy={sortBy} onSortChange={setSortBy} />

      <div className="mt-4">
        <ProductCallouts callouts={MOCK_CALLOUTS} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="Return Reasons by Product"
          subtitle="Last 30 days · Why customers are claiming"
        >
          <ReturnReasons rows={MOCK_RETURN_REASONS} />
        </ChartCard>
        <ChartCard
          title="Review Sentiment Mix"
          subtitle={`All products · ${MOCK_SENTIMENT.totalReviews} reviews`}
        >
          <SentimentCard sentiment={MOCK_SENTIMENT} />
        </ChartCard>
      </div>
    </div>
  );
}
