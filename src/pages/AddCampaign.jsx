import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import * as XLSX from "xlsx";

export default function AddCampaign() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    body: "",
    emails: "",
  });

  const updateField = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) return toast.error("Campaign name is required");
    if (!formData.title) return toast.error("Campaign title is required");
    if (!formData.body) return toast.error("Campaign body is required");

    const emails = formData.emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      await api.post("/campaigns/add", {
        name: formData.name,
        title: formData.title,
        body: formData.body,
        emails,
      });
      toast.success("Campaign created successfully");
      navigate("/campaigns");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet);

      const emails = [
        ...new Set(
          json
            .map((row) => row.Email)
            .filter(
              (email) =>
                typeof email === "string" &&
                email.trim() !== ""
            )
        ),
      ];

      setFormData((prev) => ({
        ...prev,
        emails: emails.join(", "),
      }));

      toast.success(`${emails.length} emails imported`);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-12">
        <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => navigate("/campaigns")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Add Campaign</h1>
              <p className="text-slate-500 mt-1">Create a new campaign and send emails.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={updateField("name")}
                  placeholder="Enter campaign name"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={updateField("title")}
                  placeholder="Enter email title"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Body
                </label>
                <textarea
                  value={formData.body}
                  onChange={updateField("body")}
                  rows={6}
                  placeholder="Enter campaign body"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient Emails
                </label>

                <textarea
                  value={formData.emails}
                  onChange={updateField("emails")}
                  rows={5}
                  placeholder="Enter emails separated by comma"
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2b1247]"
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Or Upload Excel (.xlsx)
                  </label>

                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="block w-full border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Emails will be extracted from the <strong>Email</strong> column and
                  automatically filled above.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-500">
                Emails will be sent to each address with the campaign name included in the content.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-[#2b1247] px-6 py-3 text-white font-semibold transition hover:bg-[#23163a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create Campaign"}
                <Save size={18} className="ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}