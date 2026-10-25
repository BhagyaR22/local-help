import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreateRequest from "./pages/CreateRequest";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Login from "./pages/Login";
import Tasks from "./pages/Tasks";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/services" element={<Services />} />

        <Route path="/login" element={<Login />} />

        <Route path="/create-request" element={<CreateRequest />}/>

        <Route path="/tasks" element={<Tasks />} />
        <Route path="/my-tasks" element={<Tasks mine />} />

        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<main className="p-8"><h1 className="text-2xl font-bold">Page not found</h1><Link className="mt-4 inline-block text-blue-600" to="/">Return home</Link></main>} />
      </Routes>
      <footer className="app-footer">
        <Link to="/" className="footer-brand">LocalHelp <span>✦</span></Link>
        <p>Smart local services, all in one place.</p>
        <Link to="/services" className="footer-link">Explore services <span aria-hidden="true">→</span></Link>
      </footer>
    </BrowserRouter>
  );
}

export default App;
