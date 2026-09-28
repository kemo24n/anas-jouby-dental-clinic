'use client';

import * as React from 'react';
import { Download, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorNote, SkeletonRows } from '@/components/ui/states';
import { TableWrap, Td, Th } from '@/components/dashboard/primitives';
import { fileKindLabels } from '@/lib/labels';
import { formatShortDate } from '@/lib/utils';
import type { FileKind } from '@prisma/client';

// ملاحظة: يُجلب معرّف المريض عبر الجلسة في مكوّن الصفحة (Server Component) أدناه.

type FileRow = {
  id: string;
  name: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

const IMAGE_KINDS: FileKind[] = ['BEFORE', 'AFTER', 'XRAY', 'CLINICAL'];

export function DocumentsView({ patientId }: { patientId: string }) {
  const [files, setFiles] = React.useState<FileRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/patients/${patientId}/files`)
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setError(payload.error ?? 'تعذر تحميل المستندات.');
          setFiles([]);
          return;
        }
        setFiles(payload.data);
      })
      .catch(() => {
        setError('تعذر الاتصال بالخادم.');
        setFiles([]);
      });
  }, [patientId]);

  const images = (files ?? []).filter((file) => IMAGE_KINDS.includes(file.kind));
  const documents = (files ?? []).filter((file) => !IMAGE_KINDS.includes(file.kind));

  return (
    <div className="animate-rise space-y-8">
      <h1 className="text-xl font-semibold">المستندات</h1>

      {error && <ErrorNote>{error}</ErrorNote>}
      {files === null && <SkeletonRows rows={6} />}

      {files !== null && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted">صور ما قبل وبعد والأشعة</h2>
            {images.length === 0 ? (
              <EmptyState icon={<FileText size={26} />} title="لا توجد صور بعد" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((file) => (
                  <figure key={file.id} className="card overflow-hidden">
                    <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${file.id}`} alt={file.name} loading="lazy" className="h-32 w-full bg-orchid-50 object-cover" />
                    </a>
                    <figcaption className="px-3 py-2">
                      <p className="text-xs font-medium">{fileKindLabels[file.kind]}</p>
                      <p className="text-[11px] text-muted">{formatShortDate(file.createdAt)}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-muted">المستندات</h2>
            {documents.length === 0 ? (
              <EmptyState icon={<FileText size={26} />} title="لا توجد مستندات بعد" />
            ) : (
              <Card>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>الاسم</Th>
                      <Th>التاريخ</Th>
                      <Th>فتح</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((file) => (
                      <tr key={file.id}>
                        <Td className="font-medium">{file.name}</Td>
                        <Td className="text-muted">{formatShortDate(file.createdAt)}</Td>
                        <Td>
                          <a href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-orchid-600 hover:underline">
                            <Download size={15} />
                            فتح
                          </a>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
