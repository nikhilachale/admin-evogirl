import { useEffect } from 'react';
import { CareEditorForm } from '@/components/admin/care-guide/care-editor-form';
import { ProductList } from '@/components/admin/care-guide/product-list';
import { S3Badge } from '@/components/admin/care-guide/s3-badge';
import {
  MOCK_CARE_GUIDES,
  MOCK_CARE_GUIDE_CONTENT,
  MOCK_CARE_GUIDE_PRODUCTS,
} from '@/data/care-guide.mock';
import { useCareGuideStore } from '@/store/care-guide';
import { toast } from '@/store/toast';

export function CareGuidePage() {
  const products = useCareGuideStore((s) => s.products);
  const activeProductId = useCareGuideStore((s) => s.activeProductId);
  const hydrate = useCareGuideStore((s) => s.hydrate);
  const selectProduct = useCareGuideStore((s) => s.selectProduct);
  const addProduct = useCareGuideStore((s) => s.addProduct);

  // Hydrate from mocks on first mount. Replace with apiFetch from
  // @/lib/api/client once the backend exposes a /care-guides endpoint.
  useEffect(() => {
    if (products.length === 0) {
      hydrate({
        products: MOCK_CARE_GUIDE_PRODUCTS,
        guides: MOCK_CARE_GUIDES,
        contents: MOCK_CARE_GUIDE_CONTENT,
      });
    }
  }, [hydrate, products.length]);

  const handleAddProduct = () => {
    const stamp = Date.now().toString().slice(-4);
    addProduct({
      name: 'New Product',
      sku: `EVO-NEW-${stamp}`,
      category: 'Hair Accessories',
    });
    toast({
      icon: '✏️',
      title: 'Rename your product',
      description: 'Update the SKU and category to match your catalog row.',
      tone: 'default',
    });
  };

  return (
    <div className="p-8">
      <header className="mb-2">
        <h1 className="text-2xl font-bold uppercase tracking-[0.18em]">
          Care Guide Editor
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage product care content and images · Stored on CephRGW S3
        </p>
      </header>

      <div className="mb-6 mt-5 flex flex-wrap items-center gap-3">
        <S3Badge label="CephRGW Connected" />
        <span className="text-[11px] font-semibold text-muted-foreground">
          Bucket: evogirl-promise-assets · 14.2 GB used
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ProductList
          products={products}
          activeProductId={activeProductId}
          onSelect={selectProduct}
          onAddProduct={handleAddProduct}
        />
        <CareEditorForm />
      </div>
    </div>
  );
}
