import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyRegistration } from '@/types/analytics';

// SVG fill/stroke accept CSS-var-driven HSL strings, so chart colors retheme
// automatically with the brand palette in src/styles/globals.css.
const HIGHLIGHT_COLOR = 'hsl(var(--brand-gold))';
const MUTED_COLOR = 'hsl(var(--brand-gold) / 0.55)';

interface Props {
  data: DailyRegistration[];
}

export function RegistrationsChart({ data }: Props) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 18, right: 8, bottom: 4, left: -24 }}
        >
          <XAxis
            dataKey="day"
            tick={{ fill: 'hsl(var(--brand-purple-light))', fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 'dataMax + 12']} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--brand-gold) / 0.06)' }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--brand-gold) / 0.25)',
              borderRadius: 8,
              fontSize: 11,
              color: 'hsl(var(--popover-foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--brand-purple-light))', fontSize: 10, fontWeight: 700 }}
            formatter={(value: number) => [value, 'Registrations']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="value"
              position="top"
              fill="hsl(var(--foreground))"
              fontSize={10}
              fontWeight={700}
            />
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.highlight ? HIGHLIGHT_COLOR : MUTED_COLOR}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
