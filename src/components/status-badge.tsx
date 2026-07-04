import { humanizeStatus } from "@/lib/utils";
import type { ProcessingStatus } from "@/lib/types";

const toneMap: Record<ProcessingStatus, string> = {
  draft: "border border-stone-200 bg-white/75 text-stone-700",
  uploaded: "border border-sky-200 bg-sky-50/90 text-sky-700",
  transcribing: "border border-amber-200 bg-amber-50/90 text-amber-700",
  analyzing: "border border-orange-200 bg-orange-50/90 text-orange-700",
  review_required: "border border-emerald-200 bg-emerald-50/90 text-emerald-700",
  approved: "border border-teal-200 bg-teal-50/90 text-teal-700",
  exported: "border border-green-200 bg-green-50/90 text-green-700",
  failed: "border border-rose-200 bg-rose-50/90 text-rose-700",
  deleted: "border border-stone-200 bg-stone-100/90 text-stone-600",
};

export function StatusBadge({ status }: { status: ProcessingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${toneMap[status]}`}
    >
      {humanizeStatus(status)}
    </span>
  );
}
