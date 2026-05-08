import type {
  AnalyticsStat,
  DailyRegistration,
  FunnelStep,
  LanguageShare,
  PlatformShare,
  ProductCallout,
  ProductPerformanceRow,
  ProductReturnReasons,
  ReviewSentiment,
} from '@/types/analytics';

// Mirrors prototype/promise-admin.html lines 2030-2249 (panel #a-analytics)
// and the A4_PRODUCTS array near line 3025.

export const MOCK_STATS: AnalyticsStat[] = [
  {
    accent: 'gold',
    value: '1,247',
    label: 'Warranties Registered',
    change: '↑ 18% vs last month',
    direction: 'up',
  },
  {
    accent: 'pink',
    value: '834',
    label: 'Reviews Submitted',
    change: '↑ 22% vs last month',
    direction: 'up',
  },
  {
    accent: 'emerald',
    value: '691',
    label: 'Vouchers Released',
    change: '↑ 15% vs last month',
    direction: 'up',
  },
  {
    accent: 'purple-light',
    value: '₹69,100',
    label: 'Vouchers Outstanding',
    change: '↓ ₹8,200 redeemed',
    direction: 'down',
  },
  {
    accent: 'gold',
    value: '2,891',
    label: 'WhatsApp Conversations',
    change: '↑ 31% vs last month',
    direction: 'up',
  },
  {
    accent: 'emerald',
    value: '94%',
    label: 'AI Resolution Rate',
    change: '↑ 3% vs last month',
    direction: 'up',
  },
];

export const MOCK_DAILY_REGISTRATIONS: DailyRegistration[] = [
  { day: 'Mon', value: 38 },
  { day: 'Tue', value: 52 },
  { day: 'Wed', value: 41 },
  { day: 'Thu', value: 67, highlight: true },
  { day: 'Fri', value: 85, highlight: true },
  { day: 'Sat', value: 71 },
  { day: 'Sun', value: 44 },
];

export const MOCK_FUNNEL: FunnelStep[] = [
  {
    label: 'Warranties registered',
    value: 1247,
    display: '1,247',
    widthPct: 100,
    accent: 'purple',
  },
  {
    label: 'Reviews submitted',
    value: 834,
    display: '834 (67%)',
    widthPct: 67,
    accent: 'pink',
  },
  {
    label: 'Vouchers released',
    value: 691,
    display: '691 (83%)',
    widthPct: 56,
    accent: 'emerald',
  },
  {
    label: 'Vouchers redeemed',
    value: 82,
    display: '82 (12%)',
    widthPct: 12,
    accent: 'gold',
  },
];

export const MOCK_PLATFORMS: PlatformShare[] = [
  { emoji: '🛒', name: 'Amazon', pct: 68, color: '#FF9900' },
  { emoji: '🏪', name: 'Flipkart', pct: 24, color: '#1A8917' },
  { emoji: '💜', name: 'evogirl.com', pct: 8, color: 'hsl(var(--brand-purple-mid))' },
];

export const MOCK_LANGUAGES: LanguageShare[] = [
  { language: 'Hindi', pct: 41 },
  { language: 'English', pct: 28 },
  { language: 'Tamil', pct: 15 },
  { language: 'Kannada', pct: 9 },
  { language: 'Telugu', pct: 7 },
];

export const MOCK_PRODUCTS: ProductPerformanceRow[] = [
  {
    emoji: '🦋',
    name: 'Butterfly Claw Clips',
    warranties: 423,
    reviews: 287,
    rating: 4.2,
    returns: 52,
    voucher: 28700,
    hue: 'pk',
  },
  {
    emoji: '🌸',
    name: 'Pearl Hair Pins (12pc)',
    warranties: 312,
    reviews: 216,
    rating: 4.8,
    returns: 3,
    voucher: 21600,
    hue: 'g',
  },
  {
    emoji: '🎀',
    name: 'Tic Tac Clip Pack (10pc)',
    warranties: 268,
    reviews: 178,
    rating: 4.4,
    returns: 31,
    voucher: 17800,
    hue: 'pl',
  },
  {
    emoji: '👑',
    name: 'Velvet Headband Set',
    warranties: 142,
    reviews: 94,
    rating: 4.1,
    returns: 19,
    voucher: 9400,
    hue: 'pk',
  },
  {
    emoji: '🌷',
    name: 'Floral Scrunchie Trio',
    warranties: 62,
    reviews: 41,
    rating: 4.6,
    returns: 4,
    voucher: 4100,
    hue: 'g',
  },
  {
    emoji: '✨',
    name: 'Rhinestone Bobby Pins',
    warranties: 40,
    reviews: 18,
    rating: 4.5,
    returns: 2,
    voucher: 1800,
    hue: 'pl',
  },
];

export const MOCK_CALLOUTS: ProductCallout[] = [
  {
    tone: 'top',
    badge: '★ TOP PERFORMER',
    emoji: '🌸',
    name: 'Pearl Hair Pins (Set of 12)',
    meta: '216 reviews · 4.8★ avg · Only 1.4% return rate',
  },
  {
    tone: 'attention',
    badge: '⚠ NEEDS ATTENTION',
    emoji: '🦋',
    name: 'Butterfly Claw Clips',
    meta: '12.3% return rate · 38 spring-failure claims this month',
  },
];

export const MOCK_RETURN_REASONS: ProductReturnReasons[] = [
  {
    emoji: '🦋',
    name: 'Butterfly Claw Clips',
    claims: 52,
    segments: [
      { label: 'Spring failure', pct: 73, color: 'hsl(var(--brand-pink))' },
      { label: 'Wrong color', pct: 15, color: 'hsl(var(--brand-gold) / 0.7)' },
      { label: 'Transit', pct: 8, color: 'rgba(74,232,154,0.5)' },
      { label: 'Other', pct: 4, color: 'rgba(255,255,255,0.15)' },
    ],
  },
  {
    emoji: '🎀',
    name: 'Tic Tac Clip Pack (10pc)',
    claims: 31,
    segments: [
      { label: 'Wrong color', pct: 48, color: 'hsl(var(--brand-gold) / 0.7)' },
      { label: 'Snapped', pct: 32, color: 'hsl(var(--brand-pink))' },
      { label: 'Transit', pct: 14, color: 'rgba(74,232,154,0.5)' },
      { label: 'Other', pct: 6, color: 'rgba(255,255,255,0.15)' },
    ],
  },
  {
    emoji: '👑',
    name: 'Velvet Headband Set',
    claims: 19,
    segments: [
      { label: 'Wrong size', pct: 42, color: 'hsl(var(--brand-gold) / 0.7)' },
      { label: 'Velvet shedding', pct: 28, color: 'hsl(var(--brand-pink))' },
      { label: 'Loose fit', pct: 21, color: 'rgba(74,232,154,0.5)' },
      { label: 'Other', pct: 9, color: 'rgba(255,255,255,0.15)' },
    ],
  },
  {
    emoji: '🌸',
    name: 'Pearl Hair Pins',
    claims: 3,
    segments: [
      { label: 'Transit damage', pct: 67, color: 'rgba(74,232,154,0.5)' },
      { label: 'Other', pct: 33, color: 'rgba(255,255,255,0.15)' },
    ],
  },
];

export const MOCK_SENTIMENT: ReviewSentiment = {
  averageRating: 4.6,
  totalReviews: 834,
  buckets: [
    { label: '5★ & 4★', pct: 71, color: '#4AE89A' },
    { label: '3★', pct: 19, color: 'hsl(var(--brand-gold) / 0.9)' },
    { label: '2★ & 1★', pct: 10, color: 'hsl(var(--brand-pink))' },
  ],
  phrases: [
    { text: '"sturdy build"', count: 142, tone: 'positive' },
    { text: '"holds all day"', count: 98, tone: 'positive' },
    { text: '"pretty packaging"', count: 76, tone: 'positive' },
    { text: '"spring broke"', count: 41, tone: 'negative' },
    { text: '"color different"', count: 28, tone: 'negative' },
    { text: '"sheds glitter"', count: 17, tone: 'negative' },
  ],
};
