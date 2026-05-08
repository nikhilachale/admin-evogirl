import type { AdminSettings } from '@/types/settings';

// Mirrors the prototype's #a-settings panel (promise-admin.html lines 2254-2308).
// All values are copy-faithful to the prototype microcopy. Replace with a real
// fetch (apiFetch from @/lib/api/client) once the backend exposes a settings
// endpoint — credentials never come down the wire to the SPA.
export const MOCK_SETTINGS: AdminSettings = {
  whatsapp: {
    status: 'connected',
    phoneNumberIdMasked: '••••••7842',
    fallbackMessage:
      'Our team will respond shortly — usually within 2 hours. 💜',
  },
  shopify: {
    status: 'connected',
    voucherAmount: 100,
    minimumCartValue: 499,
    voucherValidityDays: 45,
    autoReleaseOnVerify: true,
  },
  scraper: {
    status: 'running',
    checkFrequency: 'Every 6 hours',
    visionConfidenceThreshold: 80,
    maxRetryDays: 7,
    afterAction: 'flag-for-manual-review',
  },
  languages: [
    { code: 'en', label: 'English', enabled: true, locked: true },
    { code: 'hi', label: 'Hindi (हिंदी)', enabled: true },
    { code: 'ta', label: 'Tamil (தமிழ்)', enabled: true },
    { code: 'kn', label: 'Kannada (ಕನ್ನಡ)', enabled: true },
    { code: 'te', label: 'Telugu (తెలుగు)', enabled: true },
  ],
};
