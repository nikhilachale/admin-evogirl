const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How do I know you received my claim?',
    a: 'Right after you submit, you should see an automatic confirmation in your ticket thread (same wording you see under “What you should see first” on the Track your claim page). Email or SMS can mirror that once your backend sends them.',
  },
  {
    q: 'How long until someone replies?',
    a: 'We aim for a first human update within about two business days for standard claims. Urgent or complex cases may be faster or slower — your ticket status page shows where things stand.',
  },
  {
    q: 'Can I open more than one ticket for the same product?',
    a: 'No. Intake is limited to one ticket per product on an order so the queue cannot be flooded with duplicates. Add photos or notes in your existing ticket instead.',
  },
  {
    q: 'Where do I find my ticket ID?',
    a: 'Use the ID from your claim confirmation (for example TKT-2401). Enter it on the Help home page under Track your claim.',
  },
  {
    q: 'Why does status not change when I refresh?',
    a: 'In this demo app, status on /help reads the same browser copy the admin console last saved. With a real backend, both you and support would see live updates.',
  },
];

export function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FAQ</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quick answers for claims and the help site.
        </p>
      </div>
      <ul className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <li key={item.q}>
            <details className="group rounded-lg border border-border bg-card px-4 py-3">
              <summary className="cursor-pointer list-none font-semibold text-foreground outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="group-open:text-primary">{item.q}</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
