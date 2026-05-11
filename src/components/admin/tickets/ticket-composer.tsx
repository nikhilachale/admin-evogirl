import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTicketsStore } from '@/store/tickets';
import { MACROS } from '@/data/macros.mock';
import type { Ticket } from '@/types/domain';

type Mode = 'reply' | 'note';
type SendState = 'draft' | 'needs-review' | 'sent';

interface TicketComposerProps {
  ticket: Ticket;
}

export function TicketComposer({ ticket }: TicketComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const addMessage = useTicketsStore((s) => s.addMessage);
  const addNote = useTicketsStore((s) => s.addNote);
  const [mode, setMode] = useState<Mode>('reply');
  const [text, setText] = useState('');
  const [macrosOpen, setMacrosOpen] = useState(false);
  const [sendState, setSendState] = useState<SendState>('draft');

  const trimmed = text.trim();
  const canSend = trimmed.length > 0;
  const pinnedMacros = MACROS.filter((macro) => macro.pinned);
  const publicReplyNeedsReview =
    mode === 'reply' &&
    (ticket.dupCheck.status === 'bad' ||
      ticket.dupCheck.status === 'failed' ||
      ticket.dupCheck.status === 'unknown' ||
      ticket.dupCheck.status === 'checking' ||
      Boolean(ticket.aiReport?.flags.length));

  const applyMacroVariables = (template: string) =>
    template
      .replace(/\{customerName\}/g, ticket.customer.name)
      .replace(/\{ticketId\}/g, ticket.id)
      .replace(/\{orderId\}/g, ticket.order.id)
      .replace(
        /\{reason\}/g,
        ticket.dupCheck.details ?? ticket.aiReport?.summary ?? 'manual review',
      )
      .replace(
        /\{nextStep\}/g,
        ticket.dupCheck.status === 'ok'
          ? 'processing your request'
          : 'manual verification',
      );

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [text]);

  const applyMacro = (template: string) => {
    setText(applyMacroVariables(template));
    setSendState('draft');
  };

  const handleSend = () => {
    if (!canSend) return;
    if (publicReplyNeedsReview && sendState !== 'needs-review') {
      setSendState('needs-review');
      return;
    }

    if (mode === 'reply') {
      addMessage(ticket.id, trimmed);
    } else {
      addNote(ticket.id, trimmed);
    }
    setText('');
    setSendState('sent');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Composer mode"
          className="inline-flex items-center rounded-md border border-border bg-card p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'reply'}
            onClick={() => {
              setMode('reply');
              setSendState('draft');
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors',
              mode === 'reply'
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MessageSquare size={13} />
            Public reply
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'note'}
            onClick={() => {
              setMode('note');
              setSendState('draft');
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors',
              mode === 'note'
                ? 'bg-brand-gold/20 text-brand-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Lock size={13} />
            Internal note
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMacrosOpen((o) => !o)}
            aria-expanded={macrosOpen}
            aria-haspopup="menu"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Sparkles size={13} className="text-brand-gold" />
            Macros
          </button>
          {macrosOpen && (
            <>
              <button
                type="button"
                aria-label="Close macros"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMacrosOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1.5 w-72 overflow-hidden rounded-md border border-border bg-card shadow-lg"
              >
                <p className="border-b border-border bg-background/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Insert macro
                </p>
                <ul className="max-h-72 overflow-y-auto py-1">
                  {MACROS.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          applyMacro(m.text);
                          setMacrosOpen(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-primary/10"
                      >
                        <p className="font-semibold text-foreground">
                          {m.label}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                          {m.text}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {pinnedMacros.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pinned
          </span>
          {pinnedMacros.map((macro) => (
            <button
              key={macro.id}
              type="button"
              onClick={() => applyMacro(macro.text)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
              title={macro.text}
            >
              <Sparkles size={11} className="text-brand-gold" />
              {macro.label}
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSendState('draft');
        }}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={
          mode === 'reply'
            ? 'Reply to the customer…'
            : 'Add an internal note (only your team can see this)…'
        }
        className={cn(
          'flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          mode === 'note' && 'border-brand-gold/40 bg-brand-gold/5',
        )}
      />

      {publicReplyNeedsReview && sendState === 'needs-review' ? (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>
            This claim has risk or incomplete verification. Review the ticket
            before sending a public reply, then press send again to confirm.
          </p>
        </div>
      ) : null}

      {sendState === 'sent' ? (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-2.5 text-xs text-success">
          <CheckCircle2 size={15} />
          <span>{mode === 'reply' ? 'Reply sent.' : 'Note saved.'}</span>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {mode === 'reply' ? (
            <>Customer will receive this reply.</>
          ) : (
            <>Visible to your team only.</>
          )}{' '}
          <span className="opacity-70">
            Press{' '}
            <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">
              Ctrl
            </kbd>{' '}
            +{' '}
            <kbd className="rounded border border-border bg-card px-1 font-mono text-[10px]">
              Enter
            </kbd>{' '}
            to send.
          </span>
        </p>
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={!canSend}
          className="gap-1.5"
        >
          <Send size={14} />
          {publicReplyNeedsReview && sendState === 'needs-review'
            ? 'Confirm send'
            : mode === 'reply'
              ? 'Send reply'
              : 'Save note'}
        </Button>
      </div>
    </div>
  );
}
