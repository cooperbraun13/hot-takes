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

  useEffect(() => {
    async function loadData() {
      try {
        const [foldersData, recommendationsData] = await Promise.all([
          getfolders(),
          getrecommendations(),
        ]);
        setfolders(foldersData);
        setrecommendations(recommendationsData);
      } catch (error) {
        console.error("failed to load data", error);
      }
    }

    loadData();
  }, []);
}

export default App
