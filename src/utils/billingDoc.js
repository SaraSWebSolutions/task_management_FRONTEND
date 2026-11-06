// Helpers shared by the Quotation and Invoice pages (Refrens style documents)
import { fmtMoney, fmtDate } from "./format";

export const UOMS = ["NOS", "PCS", "UNIT", "SET", "BOX", "PACK", "KG", "GM", "LTR", "ML", "MTR", "SQFT", "HRS", "DAYS", "MONTH", "YEAR", "LS"];

// logo field: "" = default company logo, "none" = hidden, anything else = uploaded data URL
export const pickLogo = (value, fallback) => (value === "none" ? "" : value || fallback);

// meta rows (label / value) + the custom fields the user added
export const withCustomMeta = (meta, customFields = []) => [
  ...meta,
  ...customFields.filter((f) => f.label?.trim()).map((f) => [f.label, f.value]),
];

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
const three = (n) =>
  n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${two(n % 100)}` : ""}` : two(n);

// 125000.5 -> "One Lakh Twenty Five Thousand Rupees and Fifty Paise Only"
export function amountInWords(amount) {
  const total = Math.round((Number(amount) || 0) * 100);
  let rupees = Math.floor(total / 100);
  const paise = total % 100;
  if (!rupees && !paise) return "Zero Rupees Only";

  const parts = [];
  const crore = Math.floor(rupees / 1e7); rupees %= 1e7;
  const lakh = Math.floor(rupees / 1e5); rupees %= 1e5;
  const thousand = Math.floor(rupees / 1e3); rupees %= 1e3;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rupees) parts.push(three(rupees));

  let words = `${parts.join(" ") || "Zero"} Rupees`;
  if (paise) words += ` and ${two(paise)} Paise`;
  return `${words} Only`;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const br = (s) => esc(s).replace(/\n/g, "<br/>");

// Opens a clean A4 sheet in a new window and prints it ("Save as PDF" from the print dialog)
// doc: { title, number, meta: [[label, value]], from: {name, lines}, to: {name, lines},
//        fromTitle, toTitle, items: [{description, qty, rate}], totals: [[label, value, strong]],
//        words, terms, notes, logo, footer }
export function printDocument(doc) {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return false;

  const party = (title, p) => `
    <div class="box"><div class="bt">${esc(title)}</div>
      <div class="bn">${esc(p.name || "-")}</div>
      ${(p.lines || []).filter(Boolean).map((l) => `<div class="bl">${br(l)}</div>`).join("")}
    </div>`;

  const rows = doc.items
    .map((i, n) => {
      const amount = (Number(i.qty) || 0) * (Number(i.rate) || 0);
      return `<tr><td>${n + 1}</td><td>${br(i.description)}<div class="sub">${esc(i.type === "PRODUCT" ? "Product" : "Service")}</div></td><td>${esc(i.hsn || "")}</td><td>${esc(i.uom || "")}</td><td class="r">${esc(i.qty)}</td><td class="r">${fmtMoney(i.rate)}</td><td class="r">${fmtMoney(amount)}</td></tr>`;
    })
    .join("");

  const totals = doc.totals
    .map(([l, v, strong]) => `<tr class="${strong ? "tt" : ""}"><td>${esc(l)}</td><td class="r">${esc(v)}</td></tr>`)
    .join("");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${esc(doc.number || doc.title)}</title><style>
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;padding:36px;font-size:13px}
    .top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    h1{margin:0;font-size:30px;color:#7c3aed;letter-spacing:.5px} .meta{margin-top:10px;border-collapse:collapse}
    .meta td{padding:2px 14px 2px 0;color:#475569} .meta td:last-child{color:#0f172a;font-weight:600}
    .logo{max-height:60px;max-width:180px;object-fit:contain}
    .boxes{display:flex;gap:16px;margin-top:24px} .box{flex:1;background:#f5f3ff;border-radius:10px;padding:14px 16px}
    .bt{font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#7c3aed}
    .bn{margin-top:6px;font-size:15px;font-weight:700} .bl{margin-top:3px;color:#475569}
    table.items{width:100%;border-collapse:collapse;margin-top:22px}
    table.items th{background:#7c3aed;color:#fff;text-align:left;padding:9px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.6px}
    table.items td{padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top} .r{text-align:right} .sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .bottom{display:flex;justify-content:space-between;gap:24px;margin-top:18px}
    .words{flex:1;color:#475569} .words b{display:block;color:#0f172a;margin-bottom:3px}
    table.tot{border-collapse:collapse;min-width:260px} table.tot td{padding:5px 0 5px 24px}
    table.tot tr.tt td{border-top:2px solid #7c3aed;font-size:16px;font-weight:700;padding-top:9px}
    .sec{margin-top:22px} .sec b{display:block;margin-bottom:4px} .sec div{color:#475569}
    .foot{margin-top:34px;text-align:center;color:#94a3b8;font-size:12px}
    @media print{body{padding:18px}}
  </style></head><body>
    <div class="top">
      <div><h1>${esc(doc.title)}</h1>
        <table class="meta">${doc.meta.filter(([, v]) => v).map(([l, v]) => `<tr><td>${esc(l)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
      </div>
      ${doc.logo ? `<img class="logo" src="${esc(doc.logo)}" alt=""/>` : ""}
    </div>
    <div class="boxes">${party(doc.fromTitle, doc.from)}${party(doc.toTitle, doc.to)}</div>
    <table class="items"><thead><tr><th style="width:36px">#</th><th>Item</th><th style="width:80px">HSN/SAC</th><th style="width:60px">UOM</th><th class="r" style="width:60px">Qty</th><th class="r" style="width:100px">Price</th><th class="r" style="width:120px">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="bottom">
      <div class="words"><b>Total (in words)</b>${esc(doc.words)}</div>
      <table class="tot">${totals}</table>
    </div>
    ${doc.terms ? `<div class="sec"><b>Terms and Conditions</b><div>${br(doc.terms)}</div></div>` : ""}
    ${doc.notes ? `<div class="sec"><b>Notes</b><div>${br(doc.notes)}</div></div>` : ""}
    <div class="foot">${esc(doc.footer || "Thank you for your business.")}</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}

export { fmtMoney, fmtDate };

// Print sheet for a saved invoice (inv comes from the API)
export function printInvoiceDoc(inv, company = {}) {
  const withTax = inv.withTax !== false;
  return printDocument({
    title: withTax ? "Tax Invoice" : "Invoice",
    number: inv.number,
    meta: withCustomMeta(
      [["Invoice No", inv.number], ["Invoice Date", fmtDate(inv.issueDate)], ["Due Date", fmtDate(inv.dueDate)]],
      inv.customFields,
    ),
    fromTitle: "Billed By",
    from: { name: company.name || "SaraS Web Solutions", lines: [withTax && company.gstin ? `GSTIN: ${company.gstin}` : ""] },
    toTitle: "Billed To",
    to: { name: inv.clientName, lines: [inv.clientGstin ? `GSTIN: ${inv.clientGstin}` : "", inv.project?.name ? `Project: ${inv.project.name}` : ""] },
    items: inv.items.map((i) => ({ description: i.description, type: i.type, hsn: i.hsn, uom: i.uom, qty: i.quantity, rate: i.rate })),
    totals: [
      ["Amount", fmtMoney(inv.items.reduce((t, i) => t + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0))],
      ...(inv.discount > 0 ? [["Discount", `-${fmtMoney(inv.discount)}`]] : []),
      ...(withTax && inv.taxRate > 0
        ? [[`${inv.taxLabel || "Tax"} (${inv.taxRate}%${inv.taxInclusive ? ", included" : ""})`, fmtMoney(inv.taxAmount)]]
        : []),
      ["Total", fmtMoney(inv.total), true],
      ...(inv.paidAmount > 0 ? [["Paid", fmtMoney(inv.paidAmount)], ["Balance due", fmtMoney(inv.balance)]] : []),
    ],
    words: amountInWords(inv.total),
    notes: inv.notes,
    logo: pickLogo(inv.logo, company.logo),
  });
}
