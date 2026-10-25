import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import { apiRequest } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

function Services() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    let current = true;
    apiRequest("/tasks")
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
  }, [refreshKey]);

  const openTasks = useMemo(() => tasks.filter((task) => task.status === "open"), [tasks]);
  const visibleTasks = openTasks.filter((task) => {
    const matchesCategory = !category || task.category.toLowerCase() === category.toLowerCase();
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [task.title, task.description, task.location, task.category]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="section-kicker">Find a way to help nearby</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="section-heading">Services people need</h1>
            <p className="mt-3 max-w-2xl text-gray-600">Browse open requests from your community and offer help. Anyone can request a service or claim an open request.</p>
          </div>
          <Link to="/create-request" className="rounded-full bg-blue-600 px-5 py-3 font-bold text-white shadow-md hover:bg-blue-700">Request a service</Link>
        </div>

        <section className="mt-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <input aria-label="Search services" value={search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="Search requests, services, or locations" className="rounded-xl border border-gray-300 bg-white p-3" />
            <select aria-label="Filter by category" value={category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded-xl border border-gray-300 bg-white p-3">
              <option value="">All services</option>
              {SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {loading && <p className="mt-6 text-gray-600">Loading open requests…</p>}
          {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
          {!loading && !error && visibleTasks.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">{openTasks.length ? "No open requests match those filters." : "There are no open requests yet. Be the first to request a service."}</div>}
          <div className="mt-6 grid gap-5">
            {visibleTasks.map((task) => <TaskCard key={task._id} task={task} onChanged={() => setRefreshKey((value) => value + 1)} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Services;

