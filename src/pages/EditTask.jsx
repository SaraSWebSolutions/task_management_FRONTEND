import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState({
    project: "",
    taskDescription: "",
    status: "",
    remarks: "",
  });

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);

      setTask(res.data);
    } catch {
      toast.error("Failed to load task");
    }
  };

  const updateTask = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/tasks/${id}`, task);

      toast.success("Task Updated Successfully");

      const user = JSON.parse(localStorage.getItem("user"));

      if (user?.role === "ADMIN") {
        navigate("/all-tasks");
      } else {
        navigate("/my-tasks");
      }
    } catch (error) {
      toast.error("Update Failed");
    }
  };

  return (
    <Layout>
      <div className="p-8 flex justify-center">
        <form onSubmit={updateTask} className="bg-white rounded-3xl p-6 shadow w-full md:w-1/2 text-left">
          <div className="mb-4">
            <label className="font-bold mb-2">Project</label>

            <input
              type="text"
              value={task.project}
              onChange={(e) =>
                setTask({
                  ...task,
                  project: e.target.value,
                })
              }
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div className="mb-4">
            <label className="font-bold mb-2">Task Description</label>

            <textarea
              value={task.taskDescription}
              onChange={(e) =>
                setTask({
                  ...task,
                  taskDescription: e.target.value,
                })
              }
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div className="mb-4">
            <label className="font-bold mb-2">Status</label>

            <select
              value={task.status}
              onChange={(e) =>
                setTask({
                  ...task,
                  status: e.target.value,
                })
              }
              className="w-full border rounded-xl p-3"
            >
              <option>Not Started</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Blocked</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="font-bold mb-2">Remarks</label>

            <textarea
              value={task.remarks}
              onChange={(e) =>
                setTask({
                  ...task,
                  remarks: e.target.value,
                })
              }
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div className="text-center">
              <button
                type="submit"
                className="bg-[var(--brand)] text-white px-6 py-3 rounded-xl"
              >
                Update Task
              </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
