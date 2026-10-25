import { useState } from "react";
import { apiRequest, getToken } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("localhelp_user") || "null");
  } catch {
    return null;
  }
}

function TaskCard({ task, onChanged }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    location: task.location,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
  });
  const user = readSavedUser();
  const userId = user?.id || user?._id;
  const isOwner = userId && String(task.postedBy?._id || task.postedBy) === String(userId);
  const isClaimer = userId && String(task.claimedBy?._id || task.claimedBy) === String(userId);

  async function runAction(path, options = {}) {
    if (!getToken()) {
      setMessage("Please log in first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await apiRequest(path, options);
      setEditing(false);
      await onChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function saveEdit(event) {
    event.preventDefault();
    runAction(`/tasks/${task._id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    });
  }

  function deleteTask() {
    if (window.confirm("Delete this open task? This cannot be undone.")) {
      runAction(`/tasks/${task._id}`, { method: "DELETE" });
    }
  }

  return (
    <article className="rounded-lg bg-white p-6 shadow">
      {editing ? (
        <form onSubmit={saveEdit} className="grid gap-3">
          <label className="font-semibold">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="font-semibold">Category<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded border p-2">{SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="font-semibold">Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="font-semibold">Needed by (optional)<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="font-semibold">Description<textarea required rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <div className="flex gap-3"><button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white">Save</button><button type="button" onClick={() => setEditing(false)} className="rounded border px-4 py-2">Cancel</button></div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm capitalize">{task.status}</span>
          </div>
          <p className="mt-2 text-gray-600">Category: {task.category}</p>
          <p className="text-gray-600">Location: {task.location}</p>
          {task.dueDate && <p className="text-gray-600">Needed by: {new Date(task.dueDate).toLocaleDateString()}</p>}
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{task.description}</p>
          <p className="mt-2 text-sm text-gray-500">Posted by: {task.postedBy?.name || "Unknown"}</p>
          {isClaimer && task.postedBy?.contactNumber && <p className="mt-2 text-sm font-semibold text-blue-700">Contact requester: <a href={`tel:${task.postedBy.contactNumber}`} className="underline">{task.postedBy.contactNumber}</a></p>}

          <div className="mt-4 flex flex-wrap gap-3">
            {task.status === "open" && !isOwner && <button disabled={busy} onClick={() => runAction(`/tasks/${task._id}/claim`, { method: "PUT" })} className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-60">Offer Help</button>}
            {task.status === "claimed" && isClaimer && <button disabled={busy} onClick={() => runAction(`/tasks/${task._id}/complete`, { method: "PUT" })} className="rounded bg-green-700 px-5 py-2 text-white disabled:opacity-60">Mark Complete</button>}
            {task.status === "open" && isOwner && <><button onClick={() => setEditing(true)} className="rounded border border-blue-600 px-4 py-2 text-blue-700">Edit</button><button disabled={busy} onClick={deleteTask} className="rounded border border-red-600 px-4 py-2 text-red-700 disabled:opacity-60">Delete</button></>}
          </div>
        </>
      )}
      {message && <p role="alert" className="mt-3 text-red-600">{message}</p>}
    </article>
  );
}

export default TaskCard;

