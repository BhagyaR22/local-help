import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import ServiceOfferCard from "../components/ServiceOfferCard";
import { apiRequest, getToken } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

function Services() {
  const [tasks, setTasks] = useState([]);
  const [offers, setOffers] = useState([]);
  const [myInquiriesByOffer, setMyInquiriesByOffer] = useState({});
  const [error, setError] = useState("");
  const [offersError, setOffersError] = useState("");
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState("requests");
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

  useEffect(() => {
    let current = true;
    apiRequest("/offers")
      .then(async (data) => {
        if (!current) return;
        setOffers(data.offers || []);
        setOffersError("");
        if (getToken()) {
          try {
            const inquiryData = await apiRequest("/offers/inquiries");
            if (!current) return;
            const byOffer = {};
            for (const inquiry of inquiryData.inquiries || []) {
              const offerId = inquiry.offer?._id;
              if (!inquiry.isProvider && offerId && !byOffer[offerId]) byOffer[offerId] = inquiry;
            }
            setMyInquiriesByOffer(byOffer);
          } catch {
            if (current) setMyInquiriesByOffer({});
          }
        }
      })
      .catch((err) => {
        if (current) setOffersError(err.message);
      })
      .finally(() => {
        if (current) setOffersLoading(false);
      });
    return () => { current = false; };
  }, []);

  const openTasks = useMemo(() => tasks.filter((task) => task.status === "open"), [tasks]);
  const visibleTasks = openTasks.filter((task) => {
    const matchesCategory = !category || task.category.toLowerCase() === category.toLowerCase();
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [task.title, task.description, task.location, task.category]
      .some((value) => String(value || "").toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
  const visibleOffers = offers.filter((offer) => {
    const matchesCategory = !category || offer.category.toLowerCase() === category.toLowerCase();
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [offer.category, offer.description, offer.location, offer.provider?.name]
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
          <Link to={activeView === "offers" ? "/create-request?mode=offer" : "/create-request"} className="rounded-full bg-blue-600 px-5 py-3 font-bold text-white shadow-md hover:bg-blue-700">{activeView === "offers" ? "Share a service price" : "Request a service"}</Link>
        </div>

        <section className="mt-8">
          <div className="service-view-tabs" role="tablist" aria-label="Choose what to browse">
            <button type="button" role="tab" aria-selected={activeView === "requests"} className={activeView === "requests" ? "service-view-tab active" : "service-view-tab"} onClick={() => setActiveView("requests")}>Open requests</button>
            <button type="button" role="tab" aria-selected={activeView === "offers"} className={activeView === "offers" ? "service-view-tab active" : "service-view-tab"} onClick={() => setActiveView("offers")}>Service prices</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <input aria-label="Search services" value={search} onChange={(e) => updateFilter("search", e.target.value)} placeholder={activeView === "offers" ? "Search services, providers, or locations" : "Search requests, services, or locations"} className="rounded-xl border border-gray-300 bg-white p-3" />
            <select aria-label="Filter by category" value={category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded-xl border border-gray-300 bg-white p-3">
              <option value="">All services</option>
              {SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {activeView === "requests" ? (
            <>
              {loading && <p className="mt-6 text-gray-600">Loading open requests…</p>}
              {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
              {!loading && !error && visibleTasks.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">{openTasks.length ? "No open requests match those filters." : "There are no open requests yet. Be the first to request a service."}</div>}
              <div className="mt-6 grid gap-5">
                {visibleTasks.map((task) => <TaskCard key={task._id} task={task} onChanged={() => setRefreshKey((value) => value + 1)} />)}
              </div>
            </>
          ) : (
            <>
              {offersLoading && <p className="mt-6 text-gray-600">Loading service prices…</p>}
              {offersError && <p role="alert" className="mt-6 text-red-600">{offersError}</p>}
              {!offersLoading && !offersError && visibleOffers.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">{offers.length ? "No service prices match those filters." : "No service prices have been shared yet. Be the first to share yours."}</div>}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {visibleOffers.map((offer) => <ServiceOfferCard key={offer._id} offer={offer} inquiry={myInquiriesByOffer[offer._id]} />)}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Services;

