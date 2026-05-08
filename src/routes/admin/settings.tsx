import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatINR } from '@/lib/utils';
import { toast } from '@/store/toast';
import { MOCK_SETTINGS } from '@/data/settings.mock';
import {
  SCRAPER_AFTER_ACTION_LABELS,
  type AdminSettings,
  type LanguageCode,
  type ScraperAfterAction,
} from '@/types/settings';
import { SettingsSection } from '@/components/admin/settings/settings-section';
import { SettingsRow } from '@/components/admin/settings/settings-row';
import { ConnectionBadge } from '@/components/admin/settings/connection-badge';
import { ToggleSwitch } from '@/components/admin/settings/toggle-switch';

const VALUE_TEXT =
  'font-mono text-[12px] font-semibold tracking-wide text-foreground';

const FIELD_LABEL =
  'mt-3 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground';

const SCRAPER_OPTIONS: ScraperAfterAction[] = [
  'flag-for-manual-review',
  'auto-reject',
  'send-customer-whatsapp',
];

export function SettingsPage() {
  // Local state — settings is a self-contained form. No cross-component
  // consumers, so a Zustand store would be overkill (per CLAUDE.md "don't add
  // new global stores without a clear cross-component reason").
  const [settings, setSettings] = useState<AdminSettings>(MOCK_SETTINGS);
  const [pristine, setPristine] = useState<AdminSettings>(MOCK_SETTINGS);

  // Hydrate from a real fetch later. For now we re-seed if the panel was
  // unmounted and remounted.
  useEffect(() => {
    setSettings(MOCK_SETTINGS);
    setPristine(MOCK_SETTINGS);
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(pristine),
    [settings, pristine],
  );

  const updateWhatsApp = (patch: Partial<AdminSettings['whatsapp']>) =>
    setSettings((s) => ({ ...s, whatsapp: { ...s.whatsapp, ...patch } }));
  const updateShopify = (patch: Partial<AdminSettings['shopify']>) =>
    setSettings((s) => ({ ...s, shopify: { ...s.shopify, ...patch } }));
  const updateScraper = (patch: Partial<AdminSettings['scraper']>) =>
    setSettings((s) => ({ ...s, scraper: { ...s.scraper, ...patch } }));
  const toggleLanguage = (code: LanguageCode) =>
    setSettings((s) => ({
      ...s,
      languages: s.languages.map((l) =>
        l.code === code && !l.locked ? { ...l, enabled: !l.enabled } : l,
      ),
    }));

  const handleSave = () => {
    setPristine(settings);
    toast({
      title: 'Settings saved',
      description: 'All workspace changes are live.',
      tone: 'success',
      icon: '✓',
    });
  };

  const handleDiscard = () => {
    setSettings(pristine);
    toast({
      title: 'Changes discarded',
      description: 'Reverted to the last saved values.',
    });
  };

  return (
    <div className="p-8">
      <header className="mb-2">
        <h1 className="text-2xl font-bold uppercase tracking-[0.18em]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuration for all promise.evogirl.com integrations and behaviour
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* ── Column 1 ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <SettingsSection
            title="WhatsApp — Meta Cloud API"
            subtitle="Direct Meta integration · No BSP"
          >
            <SettingsRow label="Connection">
              <ConnectionBadge status={settings.whatsapp.status} />
            </SettingsRow>
            <SettingsRow
              label="Phone Number ID"
              sublabel="Business number linked"
            >
              <span className={VALUE_TEXT}>
                {settings.whatsapp.phoneNumberIdMasked}
              </span>
            </SettingsRow>

            <label className={FIELD_LABEL}>
              Fallback message (when AI unsure)
            </label>
            <Input
              value={settings.whatsapp.fallbackMessage}
              onChange={(e) =>
                updateWhatsApp({ fallbackMessage: e.target.value })
              }
              className="mt-2 bg-card/60"
            />
          </SettingsSection>

          <SettingsSection
            title="Shopify Integration"
            subtitle="evogirl.com · Admin API"
          >
            <SettingsRow label="Connection">
              <ConnectionBadge status={settings.shopify.status} />
            </SettingsRow>
            <SettingsRow label="Voucher Amount">
              <span className={VALUE_TEXT}>
                {formatINR(settings.shopify.voucherAmount)}
              </span>
            </SettingsRow>
            <SettingsRow label="Minimum Cart Value">
              <span className={VALUE_TEXT}>
                {formatINR(settings.shopify.minimumCartValue)}
              </span>
            </SettingsRow>
            <SettingsRow label="Voucher Validity">
              <span className={VALUE_TEXT}>
                {settings.shopify.voucherValidityDays} days
              </span>
            </SettingsRow>
            <SettingsRow label="Auto-release on verify">
              <ToggleSwitch
                checked={settings.shopify.autoReleaseOnVerify}
                onChange={(next) =>
                  updateShopify({ autoReleaseOnVerify: next })
                }
                label="Auto-release on verify"
              />
            </SettingsRow>
          </SettingsSection>
        </div>

        {/* ── Column 2 ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <SettingsSection
            title="Review Scraper"
            subtitle="Amazon.in + Flipkart · Platform verification"
          >
            <SettingsRow label="Scraper Status">
              <ConnectionBadge
                status={settings.scraper.status}
                label="Running"
              />
            </SettingsRow>
            <SettingsRow label="Check Frequency">
              <span className={VALUE_TEXT}>
                {settings.scraper.checkFrequency}
              </span>
            </SettingsRow>
            <SettingsRow label="Vision Confidence Threshold">
              <span className={VALUE_TEXT}>
                {settings.scraper.visionConfidenceThreshold}%
              </span>
            </SettingsRow>
            <SettingsRow label="Max Retry Days">
              <span className={VALUE_TEXT}>
                {settings.scraper.maxRetryDays} days
              </span>
            </SettingsRow>

            <label className={FIELD_LABEL} htmlFor="scraper-after">
              After 7 days — action
            </label>
            <select
              id="scraper-after"
              value={settings.scraper.afterAction}
              onChange={(e) =>
                updateScraper({
                  afterAction: e.target.value as ScraperAfterAction,
                })
              }
              className={cn(
                'mt-2 flex h-10 w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm',
                'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              {SCRAPER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {SCRAPER_AFTER_ACTION_LABELS[opt]}
                </option>
              ))}
            </select>
          </SettingsSection>

          <SettingsSection
            title="Language & Region"
            subtitle="Supported languages · Auto-detection"
          >
            {settings.languages.map((lang) => (
              <SettingsRow key={lang.code} label={lang.label}>
                <ToggleSwitch
                  checked={lang.enabled}
                  disabled={lang.locked}
                  onChange={() => toggleLanguage(lang.code)}
                  label={`${lang.label} support`}
                />
              </SettingsRow>
            ))}
          </SettingsSection>
        </div>
      </div>

      {/* ── Footer actions ────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          className="bg-gradient-to-br from-brand-pink to-[#C4006A] px-6 text-brand-white hover:opacity-90"
        >
          Save All Changes
        </Button>
        <Button
          onClick={handleDiscard}
          disabled={!isDirty}
          variant="outline"
          className="px-6"
        >
          Discard
        </Button>
        {isDirty && (
          <span className="text-[11px] font-semibold text-brand-gold">
            You have unsaved changes
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          Marketplace credentials live on your backend, never in the SPA bundle.
        </span>
      </div>
    </div>
  );
}
