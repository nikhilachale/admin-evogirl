import { create } from 'zustand';
import type { CareGuide } from '@/types/domain';
import type {
  CareGuideContent,
  CareGuideProduct,
  InspirationImage,
} from '@/data/care-guide.mock';
import { toast } from './toast';

interface CareGuideState {
  products: CareGuideProduct[];
  guides: Record<string, CareGuide>;
  contents: Record<string, CareGuideContent>;
  activeProductId: string | null;
  /** True when the form has unsaved changes for the active product. */
  dirty: boolean;

  hydrate: (input: {
    products: CareGuideProduct[];
    guides: Record<string, CareGuide>;
    contents: Record<string, CareGuideContent>;
  }) => void;

  selectProduct: (productId: string) => void;
  updateContent: <K extends keyof CareGuideContent>(
    key: K,
    value: CareGuideContent[K],
  ) => void;
  removeInspirationImage: (imageId: string) => void;
  addInspirationImage: (image: InspirationImage) => void;

  saveDraft: () => void;
  saveAndPublish: () => void;
  addProduct: (input: { name: string; sku: string; category: string }) => void;
}

export const useCareGuideStore = create<CareGuideState>((set, get) => ({
  products: [],
  guides: {},
  contents: {},
  activeProductId: null,
  dirty: false,

  hydrate: ({ products, guides, contents }) =>
    set({
      products,
      guides,
      contents,
      activeProductId: products[0]?.id ?? null,
      dirty: false,
    }),

  selectProduct: (productId) => {
    const { activeProductId, dirty } = get();
    if (productId === activeProductId) return;
    if (dirty) {
      toast({
        icon: '!',
        title: 'Unsaved changes discarded',
        description: 'Switched products before saving — edits were dropped.',
        tone: 'error',
      });
    }
    set({ activeProductId: productId, dirty: false });
  },

  updateContent: (key, value) =>
    set((s) => {
      const id = s.activeProductId;
      if (!id) return {};
      const current = s.contents[id];
      if (!current) return {};
      return {
        contents: { ...s.contents, [id]: { ...current, [key]: value } },
        dirty: true,
      };
    }),

  removeInspirationImage: (imageId) =>
    set((s) => {
      const id = s.activeProductId;
      if (!id) return {};
      const current = s.contents[id];
      if (!current) return {};
      return {
        contents: {
          ...s.contents,
          [id]: {
            ...current,
            inspirationImages: current.inspirationImages.filter(
              (img) => img.id !== imageId,
            ),
          },
        },
        dirty: true,
      };
    }),

  addInspirationImage: (image) =>
    set((s) => {
      const id = s.activeProductId;
      if (!id) return {};
      const current = s.contents[id];
      if (!current) return {};
      return {
        contents: {
          ...s.contents,
          [id]: {
            ...current,
            inspirationImages: [...current.inspirationImages, image],
          },
        },
        dirty: true,
      };
    }),

  saveDraft: () => {
    const { activeProductId, guides, products } = get();
    if (!activeProductId) return;
    const guide = guides[activeProductId];
    const product = products.find((p) => p.id === activeProductId);
    if (!guide || !product) return;
    set({
      guides: {
        ...guides,
        [activeProductId]: { ...guide, updatedAt: Date.now() },
      },
      dirty: false,
    });
    toast({
      icon: '💾',
      title: 'Draft saved',
      description: `${product.name} care guide saved to CephRGW S3.`,
      tone: 'success',
    });
  },

  saveAndPublish: () => {
    const { activeProductId, guides, products } = get();
    if (!activeProductId) return;
    const guide = guides[activeProductId];
    const product = products.find((p) => p.id === activeProductId);
    if (!guide || !product) return;
    const now = Date.now();
    set({
      guides: {
        ...guides,
        [activeProductId]: { ...guide, updatedAt: now, publishedAt: now },
      },
      dirty: false,
    });
    toast({
      icon: '🌿',
      title: 'Care guide published',
      description: `${product.name} is now live on evogirl.com.`,
      tone: 'success',
    });
  },

  addProduct: ({ name, sku, category }) => {
    const id = `p-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16)}-${Date.now()
      .toString()
      .slice(-4)}`;
    const product: CareGuideProduct = {
      id,
      name,
      sku,
      category,
      icon: '✨',
    };
    const guide: CareGuide = {
      id: `cg-${id}`,
      productCategory: category,
      title: `${name} — Care Guide`,
      updatedAt: Date.now(),
      steps: [],
    };
    const content: CareGuideContent = {
      productId: id,
      dailyCareTips: '',
      cleaningGuide: '',
      storageTips: '',
      dos: [],
      donts: [],
      inspirationImages: [],
    };
    set((s) => ({
      products: [...s.products, product],
      guides: { ...s.guides, [id]: guide },
      contents: { ...s.contents, [id]: content },
      activeProductId: id,
      dirty: false,
    }));
    toast({
      icon: '+',
      title: 'Product added',
      description: `${name} (${sku}) — start authoring its care guide.`,
      tone: 'success',
    });
  },
}));
