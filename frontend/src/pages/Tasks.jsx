import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import { apiRequest, getToken } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

function Tasks({ mine = false }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!mine || Boolean(getToken()));
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    if (mine && !getToken()) return undefined;

    let current = true;
    apiRequest(mine ? "/tasks/mine" : "/tasks")
      .then((data) => {
        if (!current) return;
        setTasks(data.tasks || []);
        setError("");
      })
      .catch((err) => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => { current = false; };
  }, [mine, refreshKey]);

  const visibleTasks = tasks.filter((task) => {
    const matchesCategory = !category || task.category.toLowerCase() === category.toLowerCase();
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [task.title, task.description, task.location, task.category]
      .some((value) => value.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-800">{mine ? "My Tasks" : "Available Tasks"}</h1>
      {mine && !getToken() && <p className="mt-4">Please <Link className="text-blue-600" to="/login">log in</Link> to see your tasks.</p>}
      {!mine && <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input aria-label="Search tasks" value={search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="Search tasks or locations" className="rounded border bg-white p-3" />
        <select aria-label="Filter by category" value={category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded border bg-white p-3">
          <option value="">All categories</option>
          {SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>}
      {loading && <p className="mt-6">Loading tasks...</p>}
      {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && visibleTasks.length === 0 && <p className="mt-6">{tasks.length ? "No tasks match those filters." : "No tasks to show yet."}</p>}
      <div className="mt-8 grid gap-6">
        {visibleTasks.map((task) => (
          <TaskCard key={task._id} task={task} onChanged={() => setRefreshKey((value) => value + 1)} />
        ))}
      </div>
      </div>
    </main>
  );
}

export default Tasks;
