import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState("5");
  const [review, setReview] = useState("");
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    category: task.category,
    location: task.location,
    budget: task.budget ?? "",
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
      if (path.endsWith("/claim")) navigate("/my-tasks");
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

  function cancelOrReleaseTask() {
    const question = isOwner
      ? "Cancel this request? It will be marked cancelled in My Activity."
      : "Release this task? It will become available for another helper.";
    if (window.confirm(question)) {
      runAction(`/tasks/${task._id}/cancel`, { method: "PUT" });
    }
  }

  function submitRating(event) {
    event.preventDefault();
    runAction(`/tasks/${task._id}/rating`, {
      method: "PATCH",
      body: JSON.stringify({ rating: Number(rating), review }),
    });
  }

  return (
    <article className="rounded-lg bg-white p-6 shadow">
      {editing ? (
        <form onSubmit={saveEdit} className="grid gap-3">
          <label className="font-semibold">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="font-semibold">Category<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded border p-2">{SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="font-semibold">Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
          <label className="font-semibold">Budget offered (LKR)<input required type="number" min="0" step="1" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
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
          <p className="font-semibold text-emerald-700">Budget offered: {task.budget === undefined || task.budget === null ? "Not set" : `LKR ${Number(task.budget).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`}</p>
          {task.dueDate && <p className="text-gray-600">Needed by: {new Date(task.dueDate).toLocaleDateString()}</p>}
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{task.description}</p>
          <p className="mt-2 text-sm text-gray-500">Posted by: {task.postedBy?.name || "Unknown"}{task.postedBy?.username && <span> · @{task.postedBy.username}</span>}</p>
          {isClaimer && task.postedBy?.contactNumber && <p className="mt-2 text-sm font-semibold text-blue-700">Contact requester: <a href={`tel:${task.postedBy.contactNumber}`} className="underline">{task.postedBy.contactNumber}</a></p>}

          <div className="mt-4 flex flex-wrap gap-3">
            {task.status === "open" && !isOwner && <button disabled={busy} onClick={() => runAction(`/tasks/${task._id}/claim`, { method: "PUT" })} className="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-60">Offer Help</button>}
            {task.status === "claimed" && isClaimer && <button disabled={busy} onClick={() => runAction(`/tasks/${task._id}/complete`, { method: "PUT" })} className="rounded bg-green-700 px-5 py-2 text-white disabled:opacity-60">Mark Complete</button>}
            {task.status === "claimed" && isClaimer && <button disabled={busy} onClick={cancelOrReleaseTask} className="rounded border border-amber-600 px-4 py-2 text-amber-700 disabled:opacity-60">Release task</button>}
            {task.status === "claimed" && isOwner && <button disabled={busy} onClick={cancelOrReleaseTask} className="rounded border border-red-600 px-4 py-2 text-red-700 disabled:opacity-60">Cancel request</button>}
            {task.status === "open" && isOwner && <><button onClick={() => setEditing(true)} className="rounded border border-blue-600 px-4 py-2 text-blue-700">Edit</button><button disabled={busy} onClick={deleteTask} className="rounded border border-red-600 px-4 py-2 text-red-700 disabled:opacity-60">Delete</button></>}
          </div>
          {task.status === "completed" && isOwner && (
            task.rating ? (
              <div className="task-rating-summary">
                <strong>Your rating: {"★".repeat(task.rating)}{"☆".repeat(5 - task.rating)} ({task.rating}/5)</strong>
                {task.ratingReview && <p>{task.ratingReview}</p>}
              </div>
            ) : (
              <form className="task-rating-form" onSubmit={submitRating}>
                <h3>Rate your helper</h3>
                <p>Your review helps neighbors choose trusted helpers.</p>
                <label>Rating
                  <select value={rating} onChange={(event) => setRating(event.target.value)}>
                    <option value="5">5 stars - Excellent</option>
                    <option value="4">4 stars - Great</option>
                    <option value="3">3 stars - Good</option>
                    <option value="2">2 stars - Fair</option>
                    <option value="1">1 star - Poor</option>
                  </select>
                </label>
                <label>Review (optional)
                  <textarea maxLength={500} value={review} onChange={(event) => setReview(event.target.value)} placeholder="Share a few words about the help you received." />
                </label>
                <button disabled={busy} className="task-rating-submit">{busy ? "Saving…" : "Submit rating"}</button>
              </form>
            )
          )}
        </>
      )}
      {message && <p role="alert" className="mt-3 text-red-600">{message}</p>}
    </article>
  );
}

export default TaskCard;
