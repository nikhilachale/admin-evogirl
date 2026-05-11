import {
  CheckCircle2,
  ExternalLink,
  ImageOff,
  ShieldAlert,
  ZoomIn,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  TicketAttachmentReview,
  TicketAttachmentReviewPatch,
} from '@/types/domain';

interface IssueAttachmentsPanelProps {
  attachments?: TicketAttachmentReview[];
  onUpdate?: (attachmentId: string, patch: TicketAttachmentReviewPatch) => void;
  title?: string;
  description?: string;
}

export function IssueAttachmentsPanel({
  attachments = [],
  onUpdate,
  title = 'Issue attachments',
  description = 'Review customer-uploaded issue proof before approving.',
}: IssueAttachmentsPanelProps) {
  const pendingCount = attachments.filter(
    (attachment) => !attachment.reviewed,
  ).length;
  const flaggedCount = attachments.filter(
    (attachment) => attachment.suspicious || attachment.imageMismatch,
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <Badge variant={pendingCount > 0 ? 'pending' : 'resolved'}>
              {pendingCount} pending
            </Badge>
            {flaggedCount > 0 && (
              <Badge variant="fraud">{flaggedCount} flagged</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {attachments.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/40 p-4 text-center text-sm text-muted-foreground">
            No attachments uploaded.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {attachments.map((attachment, index) => {
              const flagged = attachment.suspicious || attachment.imageMismatch;

              return (
                <div
                  key={attachment.id}
                  className={cn(
                    'overflow-hidden rounded-lg border bg-background/50',
                    flagged ? 'border-destructive/50' : 'border-border',
                  )}
                >
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open issue attachment ${index + 1}`}
                    className="group relative block aspect-square bg-muted"
                  >
                    {attachment.type === 'image' ? (
                      <img
                        src={attachment.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageOff size={24} />
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/30" />
                    <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <ZoomIn size={14} />
                    </span>
                    <span className="absolute bottom-2 left-2 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-foreground backdrop-blur">
                      {index + 1}/{attachments.length}
                    </span>
                  </a>

                  <div className="space-y-2 p-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={attachment.reviewed ? 'resolved' : 'pending'}
                        className="text-[10px]"
                      >
                        {attachment.reviewed ? 'Reviewed' : 'Needs review'}
                      </Badge>
                      {attachment.suspicious && (
                        <Badge variant="fraud" className="text-[10px]">
                          Suspicious
                        </Badge>
                      )}
                      {attachment.imageMismatch && (
                        <Badge variant="rejected" className="text-[10px]">
                          Image mismatch
                        </Badge>
                      )}
                    </div>

                    {attachment.reason && (
                      <p className="rounded-md bg-muted/60 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
                        {attachment.reason}
                      </p>
                    )}

                    {onUpdate && (
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-2 text-[11px]"
                          onClick={() =>
                            onUpdate(attachment.id, {
                              reviewed: !attachment.reviewed,
                            })
                          }
                        >
                          <CheckCircle2 size={13} />
                          {attachment.reviewed ? 'Unreview' : 'Reviewed'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-8 gap-1.5 px-2 text-[11px]',
                            attachment.suspicious &&
                              'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15',
                          )}
                          onClick={() =>
                            onUpdate(attachment.id, {
                              suspicious: !attachment.suspicious,
                              reason: attachment.suspicious
                                ? undefined
                                : 'Marked suspicious by agent.',
                            })
                          }
                        >
                          <ShieldAlert size={13} />
                          Flag
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-8 gap-1.5 px-2 text-[11px]',
                            attachment.imageMismatch &&
                              'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15',
                          )}
                          onClick={() =>
                            onUpdate(attachment.id, {
                              imageMismatch: !attachment.imageMismatch,
                              reason: attachment.imageMismatch
                                ? undefined
                                : 'Marked as image mismatch by agent.',
                            })
                          }
                        >
                          Mismatch
                        </Button>
                      </div>
                    )}

                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Open original <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
