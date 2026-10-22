export const DESIGNATIONS = [
  "Developer",
  "Tester",
  "UI Designer",
  "Team Lead",
  "Project Manager",
];

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Support",
  "HR",
  "Finance",
  "Operations",
];

export const GENDERS = ["Male", "Female", "Other"];

export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Singapore",
  "Malaysia",
  "United Arab Emirates",
  "Australia",
  "Canada",
  "Other",
];

export const errMsg = (err, fallback) => err?.response?.data?.message || fallback;
