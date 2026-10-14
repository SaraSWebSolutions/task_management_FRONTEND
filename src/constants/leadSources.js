export const LEAD_SOURCES = [
  { value: "BNI", label: "BNI" },
  { value: "EVENT", label: "Event" },
  { value: "META", label: "Meta" },
  { value: "INDIAMART", label: "IndiaMART" },
  { value: "OTHER", label: "Other" },
];

export const sourceLabel = (value) =>
  LEAD_SOURCES.find((s) => s.value === value)?.label || value || "-";
