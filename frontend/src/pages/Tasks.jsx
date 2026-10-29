import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import { apiRequest, getToken } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

const PAGE_SIZE = 12;
const emptyPagination = { page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 0 };

function readCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("localhelp_user") || "null");
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
}

function Tasks({ mine = false }) {
  const currentUserId = readCurrentUserId();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!mine || Boolean(getToken()));
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const requestedSort = searchParams.get("sort");
  const sort = ["newest", "dueSoonest", "dueLatest"].includes(requestedSort)
    ? requestedSort
    : "newest";
  const parsedPage = Number.parseInt(searchParams.get("page"), 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  useEffect(() => {
    if (mine && !getToken()) return undefined;

    let current = true;
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (category) query.set("category", category);
    if (search.trim()) query.set("search", search.trim());
    if (sort !== "newest") query.set("sort", sort);
    setLoading(true);
    apiRequest(`${mine ? "/tasks/mine" : "/tasks"}?${query.toString()}`)
      .then((data) => {
        if (!current) return;
        setTasks(data.tasks || []);
        setPagination(data.pagination || emptyPagination);
        setError("");
      })
      .catch((err) => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => { current = false; };
  }, [mine, refreshKey, category, search, sort, page]);

  const visibleTasks = mine ? tasks : tasks.filter((task) => {
    const postedById = task.postedBy?._id || task.postedBy;
    return task.status === "open" && (!currentUserId || String(postedById) !== String(currentUserId));
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    setSearchParams(next);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800">{mine ? "My Activity" : "Available Tasks"}</h1>
        {mine && !getToken() && <p className="mt-4">Please <Link className="text-blue-600" to="/login">log in</Link> to see your activity.</p>}
        {!mine && <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input aria-label="Search tasks" value={search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="Search tasks or locations" className="rounded border bg-white p-3" />
          <select aria-label="Filter by category" value={category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded border bg-white p-3">
            <option value="">All categories</option>
            {SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Sort tasks by date" value={sort} onChange={(e) => updateFilter("sort", e.target.value)} className="rounded border bg-white p-3">
            <option value="newest">Newest posted</option>
            <option value="dueSoonest">Soonest needed</option>
            <option value="dueLatest">Latest needed</option>
          </select>
        </div>}
        {loading && <p className="mt-6">Loading tasks...</p>}
        {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
        {!loading && !error && visibleTasks.length === 0 && <p className="mt-6">No tasks found. Try changing your search or filters.</p>}
        <div className="mt-8 grid gap-6">
          {visibleTasks.map((task) => (
            <TaskCard key={task._id} task={task} onChanged={() => setRefreshKey((value) => value + 1)} />
          ))}
        </div>
        {!loading && !error && pagination.totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Task pages">
            <button type="button" className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} tasks</span>
            <button type="button" className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={page >= pagination.totalPages} onClick={() => changePage(page + 1)}>Next</button>
          </nav>
        )}
      </div>
    </main>
  );
}

export default Tasks;
