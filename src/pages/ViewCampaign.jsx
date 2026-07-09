import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function ViewCampaign() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followTitle, setFollowTitle] = useState("");
    const [followBody, setFollowBody] = useState("");
    const [sendingFollow, setSendingFollow] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadCampaign();
    }, [id]);

    const loadCampaign = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/campaigns/${id}`);
            setCampaign(res.data.data);
        } catch (error) {
            toast.error("Failed to load campaign");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="h-[70vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#2b1247] rounded-full animate-spin"></div>
                        <p className="text-slate-500">Loading campaign...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!campaign) {
        return (
            <Layout>
                <div className="h-[70vh] flex items-center justify-center text-slate-500">
                    Campaign not found.
                </div>
            </Layout>
        );
    }

    const filteredEmails =
        campaign?.emails?.filter((email) =>
            email.toLowerCase().includes(search.toLowerCase())
        ) || [];

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
                            <h1 className="text-3xl font-bold text-slate-800">Campaign Details</h1>
                            <p className="text-slate-500 mt-1">Review campaign content and recipients.</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="rounded-3xl border bg-slate-50 p-6">
                            <div className="flex items-center gap-3 text-slate-800 font-semibold mb-4">
                                <Mail size={20} />
                                <span>Campaign Overview</span>
                            </div>
                            <div className="space-y-4 text-sm text-slate-700">
                                <div>
                                    <p className="text-slate-500">Name</p>
                                    <p className="font-medium">{campaign.name}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Title</p>
                                    <p className="font-medium">{campaign.title}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Created At</p>
                                    <p className="font-medium">{new Date(campaign.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border p-6">
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">Body</h2>
                            <p className="text-slate-600 whitespace-pre-line">{campaign.body}</p>
                        </div>

                        <div className="rounded-3xl border p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        Recipients
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {campaign.emails?.length || 0} recipients
                                    </p>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full md:w-72 border border-slate-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#2b1247]"
                                />
                            </div>

                            <div className="border rounded-2xl overflow-hidden">
                                <div className="max-h-96 overflow-y-auto">
                                    {filteredEmails.length > 0 ? (
                                        filteredEmails.map((email, index) => (
                                            <div
                                                key={email}
                                                className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-slate-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#2b1247] text-white flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>

                                                    <span className="text-slate-700">
                                                        {email}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">
                                            No recipients found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {campaign.isFollowedUp === false ? (
                            <div className="rounded-3xl border p-6">
                                <h2 className="text-xl font-semibold text-slate-800 mb-4">Send Follow-up</h2>

                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-2">Email Subject</label>
                                        <input
                                            type="text"
                                            value={followTitle}
                                            onChange={(e) => setFollowTitle(e.target.value)}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#2b1247]"
                                            placeholder="Follow-up subject"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-600 mb-2">Body</label>
                                        <textarea
                                            rows={4}
                                            value={followBody}
                                            onChange={(e) => setFollowBody(e.target.value)}
                                            className="w-full border border-slate-300 rounded-2xl px-4 py-2 outline-none focus:ring-2 focus:ring-[#2b1247]"
                                            placeholder="Follow-up message body"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={async () => {
                                                if (!followTitle) return toast.error("Subject is required");
                                                if (!followBody) return toast.error("Body is required");

                                                try {
                                                    setSendingFollow(true);
                                                    await api.post(`/campaigns/${id}/follow-up`, {
                                                        title: followTitle,
                                                        body: followBody,
                                                    });

                                                    toast.success("Follow-up emails sent");
                                                    setFollowTitle("");
                                                    setFollowBody("");
                                                    navigate("/campaigns");
                                                } catch (err) {
                                                    toast.error(err?.response?.data?.message || "Failed to send follow-up");
                                                } finally {
                                                    setSendingFollow(false);
                                                }
                                            }}
                                            disabled={sendingFollow}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#2b1247] px-5 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {sendingFollow ? "Sending..." : "Send Follow-up"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
