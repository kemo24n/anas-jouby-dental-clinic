'use client';

import * as React from 'react';
import { Pencil, Plus, Sparkles } from 'lucide-react';
import { DeleteButton } from '@/components/dashboard/delete-button';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { formatMoney } from '@/lib/utils';

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  startingPrice: number | null;
  isActive: boolean;
};

type Category = { id: string; name: string; services: Service[] };

export function ServicesManager() {
  const toast = useToast();
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ categoryId: '', name: '', description: '', durationMin: '30', startingPrice: '', imageUrl: '' });
  const [busy, setBusy] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const emptyForm = { categoryId: '', name: '', description: '', durationMin: '30', startingPrice: '', imageUrl: '' };

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(categoryId: string, service: Service) {
    setEditingId(service.id);
    setForm({
      categoryId,
      name: service.name,
      description: service.description ?? '',
      durationMin: String(service.durationMin),
      startingPrice: service.startingPrice === null ? '' : String(service.startingPrice),
      imageUrl: '',
    });
    setOpen(true);
  }

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/services?all=1');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'تعذر تحميل الخدمات.');
        setCategories([]);
        return;
      }
      setCategories(
        payload.data.map((category: Category & { services: (Service & { startingPrice: string | number | null })[] }) => ({
          ...category,
          services: category.services.map((s) => ({ ...s, startingPrice: s.startingPrice === null ? null : Number(s.startingPrice) })),
        })),
      );
    } catch {
      setError('تعذر الاتصال بالخادم.');
      setCategories([]);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(service: Service) {
    const response = await fetch(`/api/services/${service.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    if (!response.ok) {
      toast.push('تعذر تحديث الخدمة.', 'error');
      return;
    }
    toast.push(service.isActive ? 'تم إخفاء الخدمة من الموقع.' : 'تم تفعيل الخدمة على الموقع.');
    load();
  }

  async function submit() {
    setBusy(true);
    try {
      const response = await fetch(editingId ? `/api/services/${editingId}` : '/api/services', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: form.categoryId,
          name: form.name,
          description: form.description || (editingId ? '' : undefined),
          durationMin: Number(form.durationMin),
          startingPrice: form.startingPrice ? Number(form.startingPrice) : editingId ? null : undefined,
          imageUrl: form.imageUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.push(payload.error ?? 'تعذر حفظ الخدمة.', 'error');
        return;
      }
      toast.push(editingId ? 'تم حفظ التعديلات.' : 'تمت إضافة الخدمة.');
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch {
      toast.push('تعذر الاتصال بالخادم.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus size={17} />
          خدمة جديدة
        </Button>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {categories === null && <SkeletonRows rows={6} />}

      {categories !== null && categories.every((c) => c.services.length === 0) && (
        <EmptyState icon={<Sparkles size={28} />} title="لا توجد خدمات بعد" />
      )}

      {(categories ?? [])
        .filter((c) => c.services.length > 0)
        .map((category) => (
          <Card key={category.id}>
            <CardHeader title={category.name} />
            <TableWrap>
              <thead>
                <tr>
                  <Th>الخدمة</Th>
                  <Th>المدة</Th>
                  <Th>السعر التقريبي</Th>
                  <Th>الحالة</Th>
                  <Th>إجراء</Th>
                </tr>
              </thead>
              <tbody>
                {category.services.map((service) => (
                  <tr key={service.id}>
                    <Td>
                      <span className="font-medium">{service.name}</span>
                      {service.description && <span className="block text-xs text-muted">{service.description}</span>}
                    </Td>
                    <Td className="tabular-nums text-muted">{service.durationMin} د</Td>
                    <Td className="tabular-nums text-muted">{service.startingPrice ? formatMoney(service.startingPrice) : '—'}</Td>
                    <Td>
                      <Badge className={service.isActive ? 'border-[#CDE6D8] bg-[#E8F3EC] text-[#417A5C]' : 'border-line bg-canvas text-muted'}>
                        {service.isActive ? 'مفعّلة' : 'مخفية'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(category.id, service)} className="inline-flex items-center gap-1 text-sm text-orchid-600 hover:underline">
                          <Pencil size={13} /> تعديل
                        </button>
                        <button onClick={() => toggleActive(service)} className="text-sm text-muted hover:text-orchid-600 hover:underline">
                          {service.isActive ? 'إخفاء' : 'تفعيل'}
                        </button>
                        <DeleteButton
                          endpoint={`/api/services/${service.id}`}
                          title="حذف الخدمة"
                          message={`سيتم حذف خدمة «${service.name}» نهائياً من الموقع ومن الحجز. المواعيد السابقة تبقى محفوظة.`}
                          onDeleted={load}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        ))}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'تعديل الخدمة' : 'خدمة جديدة'}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-sm text-muted hover:bg-orchid-50">
              تراجع
            </button>
            <Button size="sm" loading={busy} disabled={!form.categoryId || form.name.trim().length < 2} onClick={submit}>
              حفظ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="svc-category" required>
              القسم
            </Label>
            <Select
              id="svc-category"
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            >
              <option value="">اختاري القسم</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="svc-name" required>
              اسم الخدمة
            </Label>
            <Input id="svc-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="svc-description">الوصف</Label>
            <Textarea id="svc-description" rows={2} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="svc-duration">المدة (دقيقة)</Label>
              <Input id="svc-duration" type="number" min={10} value={form.durationMin} onChange={(e) => setForm((prev) => ({ ...prev, durationMin: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="svc-price">السعر يبدأ من (اتركه فارغاً لإخفائه)</Label>
              <Input id="svc-price" type="number" min={0} value={form.startingPrice} onChange={(e) => setForm((prev) => ({ ...prev, startingPrice: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="svc-image">صورة (اختياري) — مثل /images/services/veneers.jpg</Label>
            <Input id="svc-image" dir="ltr" value={form.imageUrl} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
