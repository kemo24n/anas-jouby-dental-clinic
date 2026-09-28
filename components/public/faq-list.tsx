'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
            >
              <span className="text-[15px] font-medium">{item.question}</span>
              <span className="shrink-0 text-orchid-500">{open ? <Minus size={18} /> : <Plus size={18} />}</span>
            </button>
            {open && <p className="px-5 pb-5 text-sm leading-8 text-muted">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
