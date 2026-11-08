import { BrowserRouter, Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import MyTakes from "./pages/MyTakes";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import MyLists from "./pages/MyLists";
import GridGame from "./pages/GridGame";
import MediaDetails from "./pages/MediaDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grid" element={<GridGame />} />
        <Route path="/takes" element={<MyTakes />} />
        <Route path="/media/:mediaType/:source/:externalId" element={<MediaDetails />} />
        <Route path="/lists" element={<MyLists />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
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
