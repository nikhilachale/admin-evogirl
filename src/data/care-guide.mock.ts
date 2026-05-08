import type { CareGuide } from '@/types/domain';

// Each entry mirrors a row in the prototype's product list (promise-admin.html
// lines 1840-1869) and is paired with the editor body (lines 1873-1921). The
// prototype renders only the "Tic Tac Heart Clips" guide in detail; for the
// rest we seed a sensible scaffold (empty strings) so the editor stays usable
// when the user clicks through.

export interface CareGuideProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  /** Emoji rendered in the product list when no hero image is set. */
  icon: string;
  /** Path to the hero / 1st card image, when available. */
  heroImage?: string;
}

export interface InspirationImage {
  id: string;
  emoji: string;
  /** Tailwind gradient classes applied behind the emoji preview. */
  gradient: string;
}

export interface CareGuideContent {
  productId: string;
  dailyCareTips: string;
  cleaningGuide: string;
  storageTips: string;
  /** One do per line, matching the prototype's textarea convention. */
  dos: string[];
  /** One don't per line. */
  donts: string[];
  inspirationImages: InspirationImage[];
}

export const MOCK_CARE_GUIDE_PRODUCTS: CareGuideProduct[] = [
  {
    id: 'p-ttc-24',
    sku: 'EVO-TTC-24-BLK',
    name: 'Tic Tac Heart Clips',
    category: 'Hair Clips',
    icon: '💖',
    heroImage: 'assets/products/EVO-TTC-24-BLK/1.png?v=1776759391165',
  },
  {
    id: 'p-ptl-30',
    sku: 'EVO-PTL-30-PST',
    name: 'Fabric Ponytailers',
    category: 'Rubber Bands',
    icon: '🌸',
  },
  {
    id: 'p-scr-5',
    sku: 'EVO-SCR-5-VLV',
    name: 'Velvet Scrunchies',
    category: 'Scrunchies',
    icon: '🎀',
  },
  {
    id: 'p-hdb-3',
    sku: 'EVO-HDB-3-BLK',
    name: 'Plastic Headbands',
    category: 'Headbands',
    icon: '✨',
  },
  {
    id: 'p-clw-6',
    sku: 'EVO-CLW-6-BLK',
    name: 'Butterfly Claw Clips',
    category: 'Hair Clips',
    icon: '🦋',
  },
  {
    id: 'p-bby-24',
    sku: 'EVO-BBY-24-BLK',
    name: 'Bobby Pins',
    category: 'Hair Clips',
    icon: '📌',
  },
];

const day = 1000 * 60 * 60 * 24;

// The prototype only authors the Tic Tac body (lines 1896-1916). We mirror it
// verbatim here so microcopy survives the port. Other products start blank.
export const MOCK_CARE_GUIDES: Record<string, CareGuide> = {
  'p-ttc-24': {
    id: 'cg-ttc-24',
    productCategory: 'Hair Clips',
    title: 'Tic Tac Heart Clips — Care Guide',
    updatedAt: Date.now() - day * 2,
    publishedAt: Date.now() - day * 12,
    steps: [],
  },
  'p-ptl-30': {
    id: 'cg-ptl-30',
    productCategory: 'Rubber Bands',
    title: 'Fabric Ponytailers — Care Guide',
    updatedAt: Date.now() - day * 9,
    publishedAt: Date.now() - day * 30,
    steps: [],
  },
  'p-scr-5': {
    id: 'cg-scr-5',
    productCategory: 'Scrunchies',
    title: 'Velvet Scrunchies — Care Guide',
    updatedAt: Date.now() - day * 4,
    publishedAt: Date.now() - day * 18,
    steps: [],
  },
  'p-hdb-3': {
    id: 'cg-hdb-3',
    productCategory: 'Headbands',
    title: 'Plastic Headbands — Care Guide',
    updatedAt: Date.now() - day * 21,
    steps: [],
  },
  'p-clw-6': {
    id: 'cg-clw-6',
    productCategory: 'Hair Clips',
    title: 'Butterfly Claw Clips — Care Guide',
    updatedAt: Date.now() - day * 1,
    publishedAt: Date.now() - day * 6,
    steps: [],
  },
  'p-bby-24': {
    id: 'cg-bby-24',
    productCategory: 'Hair Clips',
    title: 'Bobby Pins — Care Guide',
    updatedAt: Date.now() - day * 14,
    steps: [],
  },
};

export const MOCK_CARE_GUIDE_CONTENT: Record<string, CareGuideContent> = {
  'p-ttc-24': {
    productId: 'p-ttc-24',
    dailyCareTips:
      'Keep Them Dry — Remove hair clips before swimming, showering, or any water activity. Metal components can oxidize when exposed to moisture.\n\nAvoid Excessive Heat — Don’t leave clips near heat styling tools or in direct sunlight for extended periods.',
    cleaningGuide:
      'Wipe with a soft dry cloth weekly to remove dust and hair product residue. For stubborn buildup, use a slightly damp cloth. Allow to air dry completely before storing.',
    storageTips:
      'Store in the included pouch or a small fabric bag. Avoid mixing with rubber bands — the elastic can react with the metal finish over time.',
    dos: [
      'Wipe with dry cloth weekly',
      'Store in a pouch',
      'Open gently',
      'Use on clean, dry hair',
    ],
    donts: [
      'Wear in water',
      'Force open/close',
      'Mix with rubber bands',
      'Expose to chemicals or hair products',
    ],
    inspirationImages: [
      {
        id: 'ins-school',
        emoji: '🏫',
        gradient: 'bg-gradient-to-br from-brand-purple-pale to-brand-purple-light',
      },
      {
        id: 'ins-work',
        emoji: '💼',
        gradient: 'bg-gradient-to-br from-pink-50 to-pink-200',
      },
      {
        id: 'ins-floral',
        emoji: '🌸',
        gradient: 'bg-gradient-to-br from-green-50 to-green-200',
      },
    ],
  },
  'p-ptl-30': {
    productId: 'p-ptl-30',
    dailyCareTips: '',
    cleaningGuide: '',
    storageTips: '',
    dos: [],
    donts: [],
    inspirationImages: [],
  },
  'p-scr-5': {
    productId: 'p-scr-5',
    dailyCareTips: '',
    cleaningGuide: '',
    storageTips: '',
    dos: [],
    donts: [],
    inspirationImages: [],
  },
  'p-hdb-3': {
    productId: 'p-hdb-3',
    dailyCareTips: '',
    cleaningGuide: '',
    storageTips: '',
    dos: [],
    donts: [],
    inspirationImages: [],
  },
  'p-clw-6': {
    productId: 'p-clw-6',
    dailyCareTips: '',
    cleaningGuide: '',
    storageTips: '',
    dos: [],
    donts: [],
    inspirationImages: [],
  },
  'p-bby-24': {
    productId: 'p-bby-24',
    dailyCareTips: '',
    cleaningGuide: '',
    storageTips: '',
    dos: [],
    donts: [],
    inspirationImages: [],
  },
};
