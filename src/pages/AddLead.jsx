import Layout from "../components/Layout";
import LeadForm from "../components/LeadForm";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AddLead() {
  const create = async (data) => {
    await api.post("/leads", data);
    toast.success("Lead created successfully");
  };

  return (
    <Layout>
      <LeadForm
        title="Add Lead"
        subtitle="Someone replied or contacted the team? Add them here."
        onSubmit={create}
      />
    </Layout>
  );
}
