import { useEffect, useState } from "react";
import { Modal, Field, PrimaryButton, GhostButton, inputClass } from "./ui";
import { PRIORITIES } from "../constants/crm";
import { PM_TASK_STATUSES } from "../constants/pm";
import { toDateInput } from "../utils/format";

const empty = {
  project: "",
  milestone: "",
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  assignee: "",
  dueDate: "",
  estimatedHours: "",
};

// Add / edit a project task. `task` = null -> new. `defaults` pre-fills a new task
// (e.g. the board column's status).
export default function ProjectTaskModal({ open, task, defaults, options, saving, onSave, onClose }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            project: task.project?._id || task.project || (task.category === "PROJECT" ? "" : task.category) || "",
            milestone: task.milestone?._id || task.milestone || "",
            title: task.title || "",
            description: task.description || "",
            status: task.status,
            priority: task.priority,
            assignee: task.assignee?._id || task.assignee || "",
            dueDate: toDateInput(task.dueDate),
            estimatedHours: task.estimatedHours || "",
          }
        : { ...empty, ...defaults },
    );
  }, [open, task, defaults]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // "SUPPORT" / "OTHER" are work with no project
  const noProject = ["SUPPORT", "OTHER"].includes(form.project);
  const milestones = (options.milestones || []).filter(
    (m) => !noProject && String(m.project) === String(form.project),
  );

  return (
    <Modal
      open={open}
      title={task ? "Edit Task" : "Add New Task"}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            disabled={saving}
            onClick={() =>
              onSave({
                ...form,
                project: noProject ? "" : form.project,
                milestone: noProject ? "" : form.milestone,
                category: noProject ? form.project : "PROJECT",
                estimatedHours: Number(form.estimatedHours) || 0,
              })
            }
          >
            {task ? "Save Task" : "Create Task"}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Task Title" required>
          <input value={form.title} onChange={set("title")} placeholder="Enter task title" className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea rows={3} value={form.description} onChange={set("description")} placeholder="Describe this task" className={inputClass} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Project / work type" required>
            <select value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value, milestone: "" }))} className={inputClass}>
              <option value="">Select project</option>
              {options.projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
              <option value="SUPPORT">No project: Support work</option>
              <option value="OTHER">No project: Other work</option>
            </select>
          </Field>
          <Field label="Milestone">
            <select value={form.milestone} onChange={set("milestone")} className={inputClass} disabled={!form.project || noProject}>
              <option value="">None</option>
              {milestones.map((m) => (
                <option key={m._id} value={m._id}>{m.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select value={form.assignee} onChange={set("assignee")} className={inputClass}>
              <option value="">Unassigned</option>
              {options.users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputClass} />
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={set("priority")} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")} className={inputClass}>
              {PM_TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Estimated Hours">
            <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={set("estimatedHours")} placeholder="0" className={inputClass} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
