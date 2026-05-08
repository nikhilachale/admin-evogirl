import type { QrProductPreset, GeneratedQrCard } from '@/types/qr';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

/**
 * SKUs offered in the QR generator's category + product dropdowns.
 * Mirrors promise-admin.html lines 1704-1718, padded out with a couple
 * of extra rows per category so the picker has something to scroll.
 */
export const QR_PRODUCT_PRESETS: QrProductPreset[] = [
  // Hair Clips
  {
    sku: 'EVO-TTC-24-BLK',
    name: 'Tic Tac Heart Clips Black Pack/24',
    category: 'clips',
  },
  {
    sku: 'EVO-TTC-12-BLK',
    name: 'Tic Tac Heart Clips Black Pack/12',
    category: 'clips',
  },
  {
    sku: 'EVO-CLW-6-BLK',
    name: 'Butterfly Claw Clips Black Pack/6',
    category: 'clips',
  },
  {
    sku: 'EVO-BBY-24-BLK',
    name: 'Bobby Pins Pack/24',
    category: 'clips',
  },
  // Rubber Bands & Ponytailers
  {
    sku: 'EVO-RBB-100-BLK',
    name: 'Rubber Bands Black Pack/100',
    category: 'bands',
  },
  {
    sku: 'EVO-PNY-12-MIX',
    name: 'Ponytailer Set Pack/12',
    category: 'bands',
  },
  // Scrunchies
  {
    sku: 'EVO-SCR-06-VLV',
    name: 'Velvet Scrunchie Set Pack/6',
    category: 'scrunchies',
  },
  {
    sku: 'EVO-SCR-03-SLK',
    name: 'Silk Scrunchie Trio',
    category: 'scrunchies',
  },
  // Headbands
  {
    sku: 'EVO-HB-01-PNK',
    name: 'Satin Fabric Headband Pink',
    category: 'headbands',
  },
  {
    sku: 'EVO-HB-02-BLK',
    name: 'Velvet Headband Set Black',
    category: 'headbands',
  },
];

/**
 * A short history of recently generated card runs, shown under the
 * generator. The prototype doesn't persist these — these mocks exist
 * so the panel has visible state when first opened.
 */
export const MOCK_QR_CARDS: GeneratedQrCard[] = [
  {
    id: 'qr-2025-04-01',
    productSku: 'EVO-TTC-24-BLK',
    productName: 'Tic Tac Heart Clips Black Pack/24',
    serial: 'BATCH-2025-04',
    batch: 'BATCH-2025-04',
    category: 'clips',
    url: 'https://promise.evogirl.com/reward?pid=EVO-TTC-24-BLK&b=BATCH-2025-04',
    urls: {
      sideA: 'https://promise.evogirl.com/reward?pid=EVO-TTC-24-BLK&b=BATCH-2025-04',
      sideB: 'https://promise.evogirl.com/help?pid=EVO-TTC-24-BLK&b=BATCH-2025-04',
    },
    qrImages: { sideA: '', sideB: '' },
    generatedAt: Date.now() - 2 * day,
    printedAt: Date.now() - 1 * day,
  },
  {
    id: 'qr-2025-03-12',
    productSku: 'EVO-SCR-06-VLV',
    productName: 'Velvet Scrunchie Set Pack/6',
    serial: 'BATCH-2025-03',
    batch: 'BATCH-2025-03',
    category: 'scrunchies',
    url: 'https://promise.evogirl.com/reward?pid=EVO-SCR-06-VLV&b=BATCH-2025-03',
    urls: {
      sideA: 'https://promise.evogirl.com/reward?pid=EVO-SCR-06-VLV&b=BATCH-2025-03',
      sideB: 'https://promise.evogirl.com/help?pid=EVO-SCR-06-VLV&b=BATCH-2025-03',
    },
    qrImages: { sideA: '', sideB: '' },
    generatedAt: Date.now() - 12 * day,
    printedAt: Date.now() - 11 * day,
  },
  {
    id: 'qr-2025-02-28',
    productSku: 'EVO-HB-01-PNK',
    productName: 'Satin Fabric Headband Pink',
    serial: 'BATCH-2025-02',
    batch: 'BATCH-2025-02',
    category: 'headbands',
    url: 'https://promise.evogirl.com/reward?pid=EVO-HB-01-PNK&b=BATCH-2025-02',
    urls: {
      sideA: 'https://promise.evogirl.com/reward?pid=EVO-HB-01-PNK&b=BATCH-2025-02',
      sideB: 'https://promise.evogirl.com/help?pid=EVO-HB-01-PNK&b=BATCH-2025-02',
    },
    qrImages: { sideA: '', sideB: '' },
    generatedAt: Date.now() - 28 * day,
    printedAt: Date.now() - 27 * day,
  },
];

export const QR_CATEGORY_LABELS: Record<
  QrProductPreset['category'],
  string
> = {
  clips: 'Hair Clips',
  bands: 'Rubber Bands & Ponytailers',
  scrunchies: 'Scrunchies',
  headbands: 'Headbands',
};
