import { fmtShort } from "../../utils/format";

export const THEAD = "bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase";
export const TROW = "border-t border-slate-100 hover:bg-slate-50/60";

// Same chart tick format everywhere
export const moneyTick = (v) => fmtShort(v);
export const apiError = (error, fallback) => error?.response?.data?.message || fallback;
