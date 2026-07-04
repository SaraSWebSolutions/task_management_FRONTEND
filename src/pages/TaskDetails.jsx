import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useRef } from "react";

import { Send, FolderKanban, Clock, Calendar, Flag } from "lucide-react";

export default function TaskDetails() {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/tasks/${id}`);

      setTask(res.data);
    } catch (error) {
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);

      await api.post(`/tasks/${id}/comment`, {
        message,
      });

      setMessage("");

      await loadTask();

      toast.success("Reply sent successfully");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };
  setTimeout(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, 100);

  if (loading) {
    return (
      <Layout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--brand)] rounded-full animate-spin"></div>

            <p className="text-slate-500">Loading Task Details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <InfoCard
            icon={<FolderKanban size={20} />}
            label="Project"
            value={task.project}
          />

          <InfoCard
            icon={<Clock size={20} />}
            label="Time Slot"
            value={task.timeSlot}
          />

          <InfoCard
            icon={<Calendar size={20} />}
            label="Date"
            value={new Date(task.date).toLocaleDateString()}
          />

          <div className="bg-white rounded-3xl p-4 border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Flag size={20} className="text-[var(--brand)]" />

              <span className="text-slate-500">Status</span>
            </div>

            <StatusBadge status={task.status} />
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl border shadow-sm p-3 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-start">
            Task Description
          </h2>

          <p className="text-slate-700 leading-8">{task.taskDescription}</p>

          {task.remarks && (
            <>
              <hr className="my-6" />

              <h3 className="font-semibold mb-2 text-start">Remarks</h3>

              <p className="text-slate-600">{task.remarks}</p>
            </>
          )}
        </div>

        {/* Discussion */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-4 py-5 border-b">
            <h2 className="text-xl font-semibold text-start">Discussion</h2>

            <p className="text-sm text-slate-500 mt-1 text-start">
              Communicate with admin and employees
            </p>
          </div>

          {/* Messages */}
          <div className="h-[300px] overflow-y-auto p-4 bg-slate-50">
            {task.comments?.length > 0 ? (
              task.comments.map((comment, index) => (
                <div
                  key={index}
                  className={`flex mb-4 ${
                    comment.sender === user.role
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xl rounded-3xl px-3 py-2 shadow-sm ${
                      comment.sender === user.role
                        ? "bg-[var(--brand)] text-white"
                        : "bg-white border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          comment.sender === user.role
                            ? "bg-white text-[var(--brand)]"
                            : "bg-[var(--brand)] text-white"
                        }`}
                      >
                        {comment.sender?.charAt(0)}
                      </div>

                      <span className="font-medium text-sm">
                        {comment.sender}
                      </span>
                    </div>

                    <p className="leading-7">{comment.message}</p>

                    <p
                      className={`text-xs mt-3 ${
                        comment.sender === user.role
                          ? "text-[var(--brand-dark)]"
                          : "text-slate-400"
                      }`}
                    >
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No discussion yet
              </div>
            )}
          </div>
          <div ref={bottomRef}></div>

          {/* Reply Box */}
          <div className="border-t p-3 bg-white">
            <div className="flex gap-4">
              <textarea
                rows="1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 border rounded-2xl p-3 resize-none focus:border-[var(--brand)] outline-none"
              />

              {/* <button
                onClick={sendReply}
                className="bg-[var(--brand)] text-white px-6 rounded-2xl flex items-center gap-2 hover:opacity-90"
              >
                <Send size={18} />
                Send
              </button> */}
              <button
                onClick={sendReply}
                disabled={sending}
                className="bg-[var(--brand)] text-white px-6 rounded-2xl flex items-center gap-2 hover:opacity-90 disabled:opacity-70"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-3xl p-3 border shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-[var(--brand)]">{icon}</div>

        <span className="text-slate-500">{label}</span>
      </div>

      <h3 className="font-semibold text-lg text-slate-800">{value || "-"}</h3>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-blue-100 text-blue-700",
    "Not Started": "bg-gray-100 text-gray-700",
    Blocked: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
