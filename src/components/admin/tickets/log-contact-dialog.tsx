import { Headset, Loader2, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatINR } from '@/lib/utils';
import { useTicketsStore } from '@/store/tickets';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import {
  findOrderCandidatesInTickets,
  findOrdersByContact,
  type OrderCandidate,
} from '@/lib/api/order-lookup';
import type {
  Marketplace,
  OrderLookupStatus,
  TicketChannel,
  TicketIssueType,
  TicketRequestType,
} from '@/types/domain';
import { ActionDialog, DialogFooter } from './ticket-action-dialogs';

const CHANNELS: { value: TicketChannel; label: string }[] = [
  { value: 'phone', label: 'Phone call' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat / WhatsApp' },
  { value: 'web-form', label: 'Web form' },
  { value: 'marketplace', label: 'Marketplace message' },
  { value: 'other', label: 'Other' },
];

const MARKETPLACES: { value: Marketplace; label: string }[] = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'flipkart', label: 'Flipkart' },
  { value: 'meesho', label: 'Meesho' },
  { value: 'myntra', label: 'Myntra' },
  { value: 'direct', label: 'Direct' },
];

const REQUEST_TYPES: { value: TicketRequestType; label: string }[] = [
  { value: 'replacement', label: 'Replacement' },
  { value: 'return', label: 'Return' },
  { value: 'refund', label: 'Refund' },
  { value: 'review-check', label: 'Review check' },
];

const ISSUE_TYPES: { value: TicketIssueType; label: string }[] = [
  { value: 'damage', label: 'Damage' },
  { value: 'color-change', label: 'Color change' },
  { value: 'wrong-item', label: 'Wrong item' },
  { value: 'defect', label: 'Defect' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: 'low' | 'normal' | 'high' | 'urgent'; label: string }[] =
  [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

// Matches the seeded "Anika Sharma / AMZ-IN-887462 — Lace Front Wig"
// ticket so the offline "find by phone + product link" demo resolves at
// 100%. Phone is the masked seed value on purpose so the digit match hits.
const DEMO_EXAMPLE = {
  name: 'Anika Sharma',
  phone: '+91 98XXX-XX138',
  productUrl:
    'https://www.amazon.in/evogirl-lace-front-wig-22-body-wave/dp/B09ABCDEF',
};

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const LABEL_CLASS =
  'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';

type OrderMode = 'known' | 'lookup';

interface ResolvedOrder {
  id: string;
  marketplace: Marketplace;
  product: string;
  sku?: string;
  amount?: number;
  purchasedAt?: number;
  deliveredAt?: number;
}

export function LogContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createTicket = useTicketsStore((s) => s.createTicket);
  const loggedBy = useAuthStore((s) => s.username) ?? 'Agent';

  const [channel, setChannel] = useState<TicketChannel>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [orderMode, setOrderMode] = useState<OrderMode>('known');
  const [orderId, setOrderId] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace>('amazon');
  const [product, setProduct] = useState('');

  const [productUrl, setProductUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<OrderCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [resolved, setResolved] = useState<ResolvedOrder | null>(null);
  const [lookupStatus, setLookupStatus] =
    useState<OrderLookupStatus>('not-attempted');

  const [requestType, setRequestType] =
    useState<TicketRequestType>('replacement');
  const [issueType, setIssueType] = useState<TicketIssueType>('damage');
  const [priority, setPriority] = useState<
    'low' | 'normal' | 'high' | 'urgent'
  >('normal');
  const [description, setDescription] = useState('');

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  const hasOrder =
    lookupStatus === 'unresolved' ||
    (orderMode === 'known'
      ? Boolean(orderId.trim() && product.trim())
      : Boolean(resolved));

  const canSubmit = Boolean(trimmedName && trimmedPhone && hasOrder);

  // Surface why the submit button is disabled — otherwise it just looks broken.
  const missingFields: string[] = [];
  if (!trimmedName) missingFields.push('customer name');
  if (!trimmedPhone) missingFields.push('mobile number');
  if (!hasOrder)
    missingFields.push(
      orderMode === 'known'
        ? 'order ID and product'
        : 'a matched order — search, then pick one (or log without a confirmed order)',
    );

  const resetForm = () => {
    setChannel('phone');
    setName('');
    setPhone('');
    setEmail('');
    setOrderMode('known');
    setOrderId('');
    setMarketplace('amazon');
    setProduct('');
    setProductUrl('');
    setSearching(false);
    setCandidates([]);
    setSearched(false);
    setResolved(null);
    setLookupStatus('not-attempted');
    setRequestType('replacement');
    setIssueType('damage');
    setPriority('normal');
    setDescription('');
  };

  const close = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSearch = async () => {
    const input = {
      phone: trimmedPhone || undefined,
      name: trimmedName || undefined,
      productUrl: productUrl.trim() || undefined,
    };
    if (!input.phone && !input.name && !input.productUrl) {
      toast({
        icon: '⚠',
        title: 'Add a detail to search',
        description: 'Enter at least a phone, name, or product link.',
        tone: 'error',
      });
      return;
    }
    setSearching(true);
    setSearched(false);
    try {
      let results: OrderCandidate[];
      try {
        results = await findOrdersByContact(input);
      } catch {
        results = findOrderCandidatesInTickets(
          input,
          useTicketsStore.getState().tickets,
        );
        toast({
          icon: '🔍',
          title: 'Searched local demo data',
          description: 'No backend reachable — matched against open tickets.',
        });
      }
      setCandidates(results);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const fillDemoExample = () => {
    setOrderMode('lookup');
    setResolved(null);
    setLookupStatus('manual');
    setCandidates([]);
    setSearched(false);
    setName(DEMO_EXAMPLE.name);
    setPhone(DEMO_EXAMPLE.phone);
    setProductUrl(DEMO_EXAMPLE.productUrl);
  };

  const pickCandidate = (c: OrderCandidate) => {
    setResolved({
      id: c.orderId,
      marketplace: c.marketplace,
      product: c.product,
      sku: c.sku,
      amount: c.amount,
      purchasedAt: c.purchasedAt,
      deliveredAt: c.deliveredAt,
    });
    setLookupStatus('matched');
  };

  const logWithoutOrder = () => {
    setResolved({
      id: `UNRESOLVED-${Date.now()}`,
      marketplace: 'direct',
      product: productUrl.trim() || 'Unconfirmed product',
    });
    setLookupStatus('unresolved');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const order =
      orderMode === 'known' && lookupStatus !== 'unresolved'
        ? {
            id: orderId.trim(),
            marketplace,
            product: product.trim(),
          }
        : {
            id: resolved!.id,
            marketplace: resolved!.marketplace,
            product: resolved!.product,
            sku: resolved!.sku,
            amount: resolved!.amount,
            purchasedAt: resolved!.purchasedAt,
            deliveredAt: resolved!.deliveredAt,
          };

    const effectiveLookup: OrderLookupStatus =
      orderMode === 'known' && lookupStatus !== 'unresolved'
        ? 'not-attempted'
        : lookupStatus;

    createTicket({
      channel,
      loggedBy,
      customer: {
        name: trimmedName,
        phone: trimmedPhone,
        email: email.trim() || undefined,
      },
      order,
      requestType,
      issueType,
      priority,
      issueDescription: description,
      rawContact: [trimmedName, trimmedPhone, email.trim()]
        .filter(Boolean)
        .join(' · '),
      productUrl: productUrl.trim() || undefined,
      lookupStatus: effectiveLookup,
      matchedOrderId: effectiveLookup === 'matched' ? order.id : undefined,
    });

    onOpenChange(false);
    resetForm();
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Log a contact"
      description="Raise a ticket for a customer who reached support by phone, email, or chat."
      icon={<Headset size={18} />}
      trigger={
        <Button className="gap-2">
          <Headset size={16} />
          Log contact
        </Button>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="-mr-2 max-h-[70vh] space-y-5 overflow-y-auto pr-2"
      >
        {/* Channel */}
        <div>
          <label className={LABEL_CLASS} htmlFor="log-channel">
            Channel
          </label>
          <select
            id="log-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as TicketChannel)}
            className={SELECT_CLASS}
          >
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS} htmlFor="log-name">
              Customer name
            </label>
            <Input
              id="log-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anika Sharma"
            />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="log-phone">
              Mobile number
            </label>
            <Input
              id="log-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765-43210"
            />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="log-email">
              Email (optional)
            </label>
            <Input
              id="log-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anika.s@example.com"
            />
          </div>
        </div>

        {/* Order */}
        <div className="space-y-3 rounded-md border border-border bg-card/45 p-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['known', 'I have the order ID'],
                ['lookup', 'No order — find by phone + product link'],
              ] as [OrderMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setOrderMode(mode);
                  setResolved(null);
                  setLookupStatus(
                    mode === 'known' ? 'not-attempted' : 'manual',
                  );
                }}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                  orderMode === mode
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {orderMode === 'known' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="log-order-id">
                  Order ID
                </label>
                <Input
                  id="log-order-id"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="AMZ-IN-887462"
                />
              </div>
              <div>
                <label className={LABEL_CLASS} htmlFor="log-marketplace">
                  Marketplace
                </label>
                <select
                  id="log-marketplace"
                  value={marketplace}
                  onChange={(e) =>
                    setMarketplace(e.target.value as Marketplace)
                  }
                  className={SELECT_CLASS}
                >
                  {MARKETPLACES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS} htmlFor="log-product">
                  Product
                </label>
                <Input
                  id="log-product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder='evogirl Lace Front Wig — 22" Body Wave'
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASS} htmlFor="log-product-url">
                  Product link
                </label>
                <div className="flex gap-2">
                  <Input
                    id="log-product-url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://amazon.in/dp/… or product page URL"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearch}
                    disabled={searching}
                    className="shrink-0 gap-2"
                  >
                    {searching ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                    Search
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tracks down the order from the mobile number, name, and
                  product link.{' '}
                  <button
                    type="button"
                    onClick={fillDemoExample}
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Use demo example
                  </button>
                </p>
              </div>

              {searched && candidates.length > 0 && (
                <ul className="space-y-1.5">
                  {candidates.map((c) => {
                    const picked =
                      resolved?.id === c.orderId &&
                      lookupStatus === 'matched';
                    return (
                      <li key={c.orderId}>
                        <button
                          type="button"
                          onClick={() => pickCandidate(c)}
                          className={cn(
                            'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                            picked
                              ? 'border-primary bg-primary/[0.08] ring-1 ring-primary/40'
                              : 'border-border bg-background hover:border-primary/45 hover:bg-card',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold">
                              {c.product}
                            </span>
                            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {Math.round(c.matchScore * 100)}% match
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {c.orderId} · {c.marketplace} ·{' '}
                            {formatINR(c.amount)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {searched && candidates.length === 0 && (
                <p className="rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                  No matching order found.
                </p>
              )}

              {searched && (
                <button
                  type="button"
                  onClick={logWithoutOrder}
                  className={cn(
                    'text-xs font-semibold underline-offset-2 hover:underline',
                    lookupStatus === 'unresolved'
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {lookupStatus === 'unresolved'
                    ? '✓ Will log without a confirmed order'
                    : 'Log without a confirmed order'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Issue */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={LABEL_CLASS} htmlFor="log-request">
              Request
            </label>
            <select
              id="log-request"
              value={requestType}
              onChange={(e) =>
                setRequestType(e.target.value as TicketRequestType)
              }
              className={SELECT_CLASS}
            >
              {REQUEST_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="log-issue">
              Issue
            </label>
            <select
              id="log-issue"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as TicketIssueType)}
              className={SELECT_CLASS}
            >
              {ISSUE_TYPES.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="log-priority">
              Priority
            </label>
            <select
              id="log-priority"
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value as 'low' | 'normal' | 'high' | 'urgent',
                )
              }
              className={SELECT_CLASS}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS} htmlFor="log-description">
            What did the customer report?
          </label>
          <textarea
            id="log-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Lace torn near the temple, wants a replacement…"
            className="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {!canSubmit && missingFields.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Still need:{' '}
            <span className="font-medium text-foreground">
              {missingFields.join(', ')}
            </span>
            .
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit} className="gap-2">
            <Headset size={16} />
            Create ticket
          </Button>
        </DialogFooter>
      </form>
    </ActionDialog>
  );
}
