/** ترقيم FDI لأسنان البالغين مع الأسماء العربية. */
export type ToothDef = { number: number; quadrant: number; nameAr: string };

const NAMES = [
  'الثنية المركزية', 'الثنية الجانبية', 'الناب', 'الضاحك الأول',
  'الضاحك الثاني', 'الرحى الأولى', 'الرحى الثانية', 'رحى العقل',
];

const QUADRANT_LABEL: Record<number, string> = {
  1: 'العلوي الأيمن',
  2: 'العلوي الأيسر',
  3: 'السفلي الأيسر',
  4: 'السفلي الأيمن',
};

export const ADULT_TEETH: ToothDef[] = [1, 2, 3, 4].flatMap((quadrant) =>
  NAMES.map((name, index) => ({
    number: quadrant * 10 + index + 1,
    quadrant,
    nameAr: `${name} ${QUADRANT_LABEL[quadrant]}`,
  })),
);

/** ترتيب العرض في المخطط: الفك العلوي من اليمين لليسار، ثم السفلي. */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

export function toothName(number: number): string {
  return ADULT_TEETH.find((t) => t.number === number)?.nameAr ?? `السن ${number}`;
}
