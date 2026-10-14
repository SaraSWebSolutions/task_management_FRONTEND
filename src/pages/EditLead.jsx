import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import LeadForm from "../components/LeadForm";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EditLead() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);

  useEffect(() => {
    api
      .get(`/leads/${id}`)
      .then((res) => setLead(res.data.lead))
      .catch(() => toast.error("Failed to load lead"));
  }, [id]);

  const update = async (data) => {
    await api.put(`/leads/${id}`, data);
    toast.success("Lead updated successfully");
  };

  return (
    <Layout>
      {lead ? (
        <LeadForm
          title="Edit Lead"
          subtitle="Update the lead details."
          initial={{
            name: lead.name || "",
            company: lead.company || "",
            email: lead.email || "",
            phone: lead.phone || "",
            source: lead.source || "OTHER",
            requestType: lead.requestType || "",
            demoType: lead.demoType || "",
            notes: lead.notes || "",
          }}
          onSubmit={update}
        />
      ) : (
        <p className="text-center text-slate-500 mt-20">Loading...</p>
      )}
    </Layout>
  );
}
