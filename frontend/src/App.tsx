import { BrowserRouter, Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import MyTakes from "./pages/MyTakes";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/takes" element={<MyTakes />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/movies" element={<Home mediaType="movie" />} />
        <Route path="/tv" element={<Home mediaType="tv" />} />
        <Route path="/books" element={<Home mediaType="book" />} />
        <Route path="/music" element={<Home mediaType="music" />} />
        <Route path="/games" element={<Home mediaType="game" />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
