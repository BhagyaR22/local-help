import { Link } from "react-router-dom";
import { CATEGORY_ICONS } from "../data/serviceCategories";

function ServiceCard({ service }) {
  return (
    <article className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <span className="category-icon" aria-hidden="true">{CATEGORY_ICONS[service] || "✨"}</span>
      <h2 className="mt-4 text-xl font-bold text-gray-800">{service}</h2>

      <p className="mt-2 text-gray-600">
        Find people who can help with {service.toLowerCase()}.
      </p>
      <Link to={`/tasks?category=${encodeURIComponent(service)}`} className="mt-4 inline-block font-semibold text-blue-600">
        Browse {service} tasks
      </Link>
    </article>
  );
}

export default ServiceCard;
