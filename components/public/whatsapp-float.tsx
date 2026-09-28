import { MessageCircle } from 'lucide-react';
import { whatsappLink, WA_MESSAGES } from '@/lib/whatsapp';

export function WhatsappFloat({ whatsapp }: { whatsapp: string }) {
  return (
    <a
      href={whatsappLink(WA_MESSAGES.general, whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-5 left-5 z-40 flex h-13 items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-lift transition-transform hover:scale-[1.03]"
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline">تواصل عبر واتساب</span>
    </a>
  );
}
