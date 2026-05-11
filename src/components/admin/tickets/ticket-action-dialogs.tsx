import * as Dialog from '@radix-ui/react-dialog';
import {
  Banknote,
  CheckCircle2,
  Flag,
  Gift,
  PackageCheck,
  RotateCcw,
  Send,
  UserRoundPlus,
  X,
  XCircle,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTicketsStore } from '@/store/tickets';
import type { RejectionReasonCategory, Ticket } from '@/types/domain';
import { formatINR } from '@/lib/utils';
import { Kbd } from './kbd';

const REJECTION_LABEL: Record<RejectionReasonCategory, string> = {
  'duplicate-claim': 'Duplicate claim',
  'invalid-order': 'Invalid order',
  'outside-warranty-window': 'Outside warranty window',
  'insufficient-proof': 'Insufficient proof',
  'photo-mismatch': 'Photo mismatch',
  'product-not-covered': 'Product not covered',
  'suspected-fraud': 'Suspected fraud',
  other: 'Other',
};

interface TicketOpenActionsProps {
  ticket: Ticket;
  approvalWarnings: string[];
}

export function TicketOpenActions({
  ticket,
  approvalWarnings,
}: TicketOpenActionsProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [fraudOpen, setFraudOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const issueReplacement = useTicketsStore((s) => s.issueReplacement);
  const issueRefund = useTicketsStore((s) => s.issueRefund);
  const issueVoucher = useTicketsStore((s) => s.issueVoucher);
  const resolve = useTicketsStore((s) => s.resolve);
  const flagFraud = useTicketsStore((s) => s.flagFraud);
  const escalate = useTicketsStore((s) => s.escalate);
  const reassign = useTicketsStore((s) => s.reassign);

  return (
    <div className="border-t bg-background/95 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ConfirmActionDialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            title="Issue replacement"
            description={`Close ${ticket.id} with a replacement resolution.`}
            icon={<PackageCheck size={18} />}
            trigger={
              <Button className="gap-2">
                <PackageCheck size={16} />
                Issue replacement
              </Button>
            }
            confirmLabel="Issue replacement"
            onConfirm={() => issueReplacement(ticket.id)}
          >
            {approvalWarnings.length > 0 ? (
              <WarningList
                title="Review warnings before issuing replacement"
                items={approvalWarnings}
              />
            ) : (
              <p className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-muted-foreground">
                Evidence looks clean for a replacement resolution.
              </p>
            )}
          </ConfirmActionDialog>

          <RejectTicketDialog
            ticketId={ticket.id}
            open={rejectOpen}
            onOpenChange={setRejectOpen}
          />

          <ConfirmActionDialog
            open={refundOpen}
            onOpenChange={setRefundOpen}
            title="Issue refund"
            description={`Refund ${formatINR(ticket.order.amount)} for ${ticket.id}.`}
            icon={<Banknote size={18} />}
            trigger={
              <Button variant="outline" className="gap-2">
                <Banknote size={16} />
                Refund
              </Button>
            }
            confirmLabel="Issue refund"
            onConfirm={() => issueRefund(ticket.id)}
          >
            <p className="rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">
              This resolves the ticket and records the order amount as the
              refund.
            </p>
          </ConfirmActionDialog>

          <VoucherDialog
            ticket={ticket}
            open={voucherOpen}
            onOpenChange={setVoucherOpen}
            onSubmit={(amount) => issueVoucher(ticket.id, amount)}
          />

          <ConfirmActionDialog
            open={resolveOpen}
            onOpenChange={setResolveOpen}
            title="Resolve without payout"
            description={`Mark ${ticket.id} resolved without refund, voucher, or replacement.`}
            icon={<CheckCircle2 size={18} />}
            trigger={
              <Button variant="outline" className="gap-2">
                <CheckCircle2 size={16} />
                Resolve
              </Button>
            }
            confirmLabel="Resolve ticket"
            onConfirm={() => resolve(ticket.id)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <ConfirmActionDialog
            open={fraudOpen}
            onOpenChange={setFraudOpen}
            title="Flag as fraud"
            description={`Apply a fraud flag to ${ticket.id}.`}
            icon={<Flag size={18} />}
            trigger={
              <Button variant="outline" className="gap-2">
                <Flag size={16} />
                Flag fraud
              </Button>
            }
            confirmLabel="Flag fraud"
            confirmVariant="destructive"
            onConfirm={() => flagFraud(ticket.id)}
          >
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
              The ticket stays open, but fraud risk and duplicate signals are
              raised for the claim.
            </p>
          </ConfirmActionDialog>

          <ReassignDialog
            open={reassignOpen}
            onOpenChange={setReassignOpen}
            currentAgent={ticket.agent}
            onSubmit={(agent) => reassign(ticket.id, agent)}
          />

          <Button variant="ghost" onClick={() => escalate(ticket.id)}>
            Escalate
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TicketClosedActions({ ticket }: { ticket: Ticket }) {
  const [reason, setReason] = useState('');
  const reopen = useTicketsStore((s) => s.reopen);
  const trimmed = reason.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    reopen(ticket.id, trimmed);
    setReason('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-background/95 px-6 py-4 backdrop-blur"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[280px] flex-1">
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="reopen-reason"
          >
            Reopen reason
          </label>
          <Input
            id="reopen-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Customer replied, new evidence received..."
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={!trimmed}
          className="gap-2"
        >
          <RotateCcw size={16} />
          Reopen ticket
        </Button>
      </div>
    </form>
  );
}

function RejectTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [category, setCategory] =
    useState<RejectionReasonCategory>('insufficient-proof');
  const [reason, setReason] = useState('');
  const reject = useTicketsStore((s) => s.reject);
  const trimmed = reason.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    reject(ticketId, category, trimmed);
    setReason('');
    onOpenChange(false);
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reject claim"
      description={`Reject ${ticketId} with a categorized reason.`}
      icon={<XCircle size={18} />}
      trigger={
        <Button variant="destructive" className="gap-2">
          <XCircle size={16} />
          Reject
          <Kbd className="ml-1 border-destructive-foreground/30 bg-destructive-foreground/10 text-destructive-foreground/80">
            x
          </Kbd>
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="reject-category"
          >
            Rejection category
          </label>
          <select
            id="reject-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as RejectionReasonCategory)
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {Object.entries(REJECTION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="reject-reason"
          >
            Rejection reason
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Duplicate claim, invalid proof..."
            rows={4}
            className="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <DialogFooter>
          <Dialog.Close asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Dialog.Close>
          <Button type="submit" variant="destructive" disabled={!trimmed}>
            Reject claim
          </Button>
        </DialogFooter>
      </form>
    </ActionDialog>
  );
}

function VoucherDialog({
  ticket,
  open,
  onOpenChange,
  onSubmit,
}: {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(
    String(Math.round(ticket.order.amount / 2)),
  );
  const parsedAmount = Number(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(Math.round(parsedAmount));
    onOpenChange(false);
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Issue voucher"
      description={`Create a goodwill voucher for ${ticket.id}.`}
      icon={<Gift size={18} />}
      trigger={
        <Button variant="outline" className="gap-2">
          <Gift size={16} />
          Voucher
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="voucher-amount"
          >
            Voucher amount
          </label>
          <Input
            id="voucher-amount"
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Order value is {formatINR(ticket.order.amount)}.
          </p>
        </div>
        <DialogFooter>
          <Dialog.Close asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Dialog.Close>
          <Button type="submit" disabled={!isValid}>
            Issue voucher
          </Button>
        </DialogFooter>
      </form>
    </ActionDialog>
  );
}

function ReassignDialog({
  open,
  onOpenChange,
  currentAgent,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAgent?: string;
  onSubmit: (agent: string) => void;
}) {
  const [agent, setAgent] = useState(currentAgent ?? '');
  const trimmed = agent.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reassign ticket"
      description="Move this ticket to another agent or queue."
      icon={<UserRoundPlus size={18} />}
      trigger={
        <Button variant="outline" className="gap-2">
          <UserRoundPlus size={16} />
          Reassign
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            htmlFor="reassign-agent"
          >
            Agent or queue
          </label>
          <Input
            id="reassign-agent"
            value={agent}
            onChange={(event) => setAgent(event.target.value)}
            placeholder="Senior support queue"
          />
        </div>
        <DialogFooter>
          <Dialog.Close asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Dialog.Close>
          <Button type="submit" disabled={!trimmed} className="gap-2">
            <Send size={16} />
            Reassign
          </Button>
        </DialogFooter>
      </form>
    </ActionDialog>
  );
}

function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  trigger,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: ReactNode;
  trigger: ReactNode;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon}
      trigger={trigger}
    >
      <div className="space-y-4">
        {children}
        <DialogFooter>
          <Dialog.Close asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </div>
    </ActionDialog>
  );
}

function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: ReactNode;
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-card p-6 text-card-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </span>
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold leading-none tracking-tight">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
          </div>
          {children}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

function WarningList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm font-semibold text-destructive">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
