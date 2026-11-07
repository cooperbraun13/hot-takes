import { BrowserRouter, Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Home />} />
        <Route path="/tv" element={<Home />} />
        <Route path="/books" element={<Home />} />
        <Route path="/music" element={<Home />} />
        <Route path="/games" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
