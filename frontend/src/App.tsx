import { useEffect, useState } from "react"
import "./App.css";
import TopNav from "./components/TopNav";
import MediaCard from "./components/MediaCard";
// import {getfolders, getrecommendations} from "./services/api";
import type {item} from "./types/items";




function App() {
  const [folders, setfolders] = useState<item[]>([]);
  const [recommendations, setrecommendations] = useState<item[]>([]);
  const [searchResults, setsearchresults] = useState<item[]>([]);
  const [active, setactive] = useState("");
}

export default App
