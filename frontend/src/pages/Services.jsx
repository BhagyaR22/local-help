import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import ServiceOfferCard from "../components/ServiceOfferCard";
import { apiRequest, getToken } from "../services/api";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";

const PAGE_SIZE = 12;
const emptyPagination = { page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 0 };

function makeQuery(page, category, search) {
  const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (category) query.set("category", category);
  if (search.trim()) query.set("search", search.trim());
  return query.toString();
}

function Services() {
  const [tasks, setTasks] = useState([]);
  const [offers, setOffers] = useState([]);
  const [taskPagination, setTaskPagination] = useState(emptyPagination);
  const [offerPagination, setOfferPagination] = useState(emptyPagination);
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
  const parsedPage = Number.parseInt(searchParams.get("page"), 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;


  useEffect(() => {
    let current = true;
    setLoading(true);
    apiRequest(`/tasks?${makeQuery(page, category, search)}`)
      .then((data) => {
        if (!current) return;
        setTasks(data.tasks || []);
        setTaskPagination(data.pagination || emptyPagination);
        setError("");
      })
      .catch((err) => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [category, search, page, refreshKey]);

  useEffect(() => {
    let current = true;
    setOffersLoading(true);
    apiRequest(`/offers?${makeQuery(page, category, search)}`)
      .then(async (data) => {
        if (!current) return;
        setOffers(data.offers || []);
        setOfferPagination(data.pagination || emptyPagination);
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
        } else {
          setMyInquiriesByOffer({});
        }
      })
      .catch((err) => {
        if (current) setOffersError(err.message);
      })
      .finally(() => {
        if (current) setOffersLoading(false);
      });
    return () => { current = false; };
  }, [category, search, page]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function changeView(view) {
    setActiveView(view);
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    setSearchParams(next);
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    setSearchParams(next);
  }

  const activePagination = activeView === "requests" ? taskPagination : offerPagination;
  const activeLoading = activeView === "requests" ? loading : offersLoading;
  const activeError = activeView === "requests" ? error : offersError;
  const itemLabel = activeView === "requests" ? "requests" : "providers";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="section-kicker">Find a way to help nearby</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="section-heading">Find local help</h1>
            <p className="mt-3 max-w-2xl text-gray-600">Choose a help request to take on, or browse local providers and compare their prices per job.</p>
          </div>
          <Link to={activeView === "offers" ? "/create-request?mode=offer" : "/create-request"} className="rounded-full bg-blue-600 px-5 py-3 font-bold text-white shadow-md hover:bg-blue-700">{activeView === "offers" ? "List a service" : "Post a help request"}</Link>
        </div>

        <section className="mt-8">
          <div className="service-view-tabs" role="tablist" aria-label="Choose what to browse">
            <button type="button" role="tab" aria-selected={activeView === "requests"} className={activeView === "requests" ? "service-view-tab active" : "service-view-tab"} onClick={() => changeView("requests")}>People needing help</button>
            <button type="button" role="tab" aria-selected={activeView === "offers"} className={activeView === "offers" ? "service-view-tab active" : "service-view-tab"} onClick={() => changeView("offers")}>Local providers</button>
          </div>
          <p className="mb-4 mt-3 text-sm text-gray-600">{activeView === "requests" ? "People post a task and the budget they are offering." : "Providers list a service and the price they charge per job. Contact them to enquire."}</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <input aria-label="Search services" value={search} onChange={(e) => updateFilter("search", e.target.value)} placeholder={activeView === "offers" ? "Search local providers, services, or locations" : "Search help requests, services, or locations"} className="rounded-xl border border-gray-300 bg-white p-3" />
            <select aria-label="Filter by category" value={category} onChange={(e) => updateFilter("category", e.target.value)} className="rounded-xl border border-gray-300 bg-white p-3">
              <option value="">All services</option>
              {SERVICE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {activeView === "requests" ? (
            <>
              {loading && <p className="mt-6 text-gray-600">Loading help requests…</p>}
              {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
              {!loading && !error && tasks.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">No help requests found. Try changing your search or filters.</div>}
              <div className="mt-6 grid gap-5">
                {tasks.map((task) => <TaskCard key={task._id} task={task} onChanged={() => setRefreshKey((value) => value + 1)} />)}
              </div>
            </>
          ) : (
            <>
              {offersLoading && <p className="mt-6 text-gray-600">Loading local providers…</p>}
              {offersError && <p role="alert" className="mt-6 text-red-600">{offersError}</p>}
              {!offersLoading && !offersError && offers.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">No local providers found. Try changing your search or filters.</div>}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {offers.map((offer) => <ServiceOfferCard key={offer._id} offer={offer} inquiry={myInquiriesByOffer[offer._id]} />)}
              </div>
            </>
          )}
          {!activeLoading && !activeError && activePagination.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4" aria-label={`${itemLabel} pages`}>
              <button type="button" className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
              <span className="text-sm text-gray-600">Page {activePagination.page} of {activePagination.totalPages} · {activePagination.totalItems} {itemLabel}</span>
              <button type="button" className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={page >= activePagination.totalPages} onClick={() => changePage(page + 1)}>Next</button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

export default Services;