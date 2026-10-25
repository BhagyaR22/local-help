import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, clearSession, getToken } from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    apiRequest("/users/me")
      .then((data) => setUser(data.user))
      .catch((err) => setError(err.message));
  }, []);

  function logout() {
    clearSession();
    window.location.href = "/";
  }

  if (!getToken()) {
    return <main className="p-8"><p>Please log in to view your profile.</p><Link className="text-blue-600" to="/login">Go to login</Link></main>;
  }

  if (error) {
    return <main className="p-8"><p>{error}</p><Link className="text-blue-600" to="/login">Go to login</Link></main>;
  }

  if (!user) return <main className="p-8">Loading profile...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
      <section className="mt-8 max-w-xl rounded-lg bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">{user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.name}</h2>
        <p className="mt-2 text-gray-600">Username: {user.username ? `@${user.username}` : "Not set"}</p>
        <p className="mt-2 text-gray-600">Contact number: {user.contactNumber || "Not set"}</p>
        <p className="mt-3 text-gray-600">Email: {user.email}</p>
        <p className="mt-2 text-gray-600">Reputation: {user.reputation}</p>
        <button onClick={logout} className="mt-6 rounded bg-gray-800 px-5 py-2 text-white">
          Log out
        </button>
      </section>
    </main>
  );
}

export default Profile;


