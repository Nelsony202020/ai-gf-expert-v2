// Simplified product creation: four fields, then straight into the product
// workspace. Everything else is completed inside the workspace tabs.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataApi, type EntityRow } from '../api';
import { ProductMediaField } from '../ProductMediaField';
import { slugify } from '../slugify';
import {
  Button,
  ErrorNote,
  Field,
  Icon,
  InputWithPrefix,
  InsetTextInput,
  TextInput,
  useAsync,
} from '../ui';

export function NewProductPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoId, setLogoId] = useState<string | null>(null);
  const [mediaRows, setMediaRows] = useState<EntityRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { busy, error, run } = useAsync();

  useEffect(() => {
    dataApi.list('media').then((r) => setMediaRows(r.rows)).catch(() => {});
  }, []);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Product name is required.';
    if (!slug.trim()) errors.slug = 'Slug is required.';
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug = 'Use lowercase letters, numbers, and hyphens only.';
    }
    if (!websiteUrl.trim()) errors.websiteUrl = 'Official website is required.';
    else if (!/^https?:\/\//.test(websiteUrl.trim())) {
      errors.websiteUrl = 'Must be an http(s) URL.';
    }
    if (!logoId) errors.logo = 'Product logo is required.';
    return errors;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const created = await run(() =>
      dataApi.create(
        'products',
        {
          name: name.trim(),
          slug: slug.trim(),
          status: 'draft',
          websiteUrl: websiteUrl.trim(),
          priceCurrency: 'USD',
        },
        { logo: logoId },
      ),
    );
    if (created) {
      navigate(`/products/${created.id}/setup?created=1`, { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/products" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add product</h2>
          <p className="text-sm text-slate-500">
            Start with the essentials — everything else is completed inside the product workspace.
          </p>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      <form
        onSubmit={create}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6"
      >
        <Field label="Product name" required>
          <TextInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugManual) setSlug(slugify(e.target.value));
            }}
            placeholder="e.g. Aura AI"
            aria-invalid={Boolean(fieldErrors.name)}
            className={fieldErrors.name ? 'border-red-400' : ''}
            autoFocus
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </Field>

        <Field label="Slug" required help="The public review URL: /reviews/{slug}">
          <TextInput
            value={slug}
            onChange={(e) => {
              setSlugManual(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
            }}
            placeholder="e.g. aura-ai"
            aria-invalid={Boolean(fieldErrors.slug)}
            className={[
              fieldErrors.slug ? 'border-red-400' : '',
              !slugManual ? 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
          {fieldErrors.slug && <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>}
        </Field>

        <Field label="Official website URL" required>
          <InputWithPrefix
            prefix={<Icon name="language" className="!text-[18px]" />}
            invalid={Boolean(fieldErrors.websiteUrl)}
          >
            <InsetTextInput
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </InputWithPrefix>
          {fieldErrors.websiteUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.websiteUrl}</p>}
        </Field>

        <div>
          <ProductMediaField
            label="Product logo"
            hint="This is the product — the main logo of the product."
            supportedText="PNG, JPG, JPEG, or SVG • Max 2MB"
            role="logo"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            value={logoId}
            mediaRows={mediaRows}
            onChange={setLogoId}
            onUploaded={() => dataApi.list('media').then((r) => setMediaRows(r.rows)).catch(() => {})}
          />
          {fieldErrors.logo && <p className="mt-1 text-xs text-red-600">{fieldErrors.logo}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs text-slate-400">The product is created as a draft.</p>
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create product workspace'}
          </Button>
        </div>
      </form>
    </div>
  );
}
