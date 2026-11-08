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
        <Route path="/movies" element={<Home />} />
        <Route path="/tv" element={<Home />} />
        <Route path="/books" element={<Home />} />
        <Route path="/music" element={<Home />} />
        <Route path="/games" element={<Home />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
