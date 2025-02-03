// import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { ContainerList } from "./components/ContainerList";
import { ImageList } from "./components/ImageList";
import { NavBar } from "./components/NavBar";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";

export function App() {

  const [activeSection, setActiveSection] = useState("containers");

  useEffect(() => {
    const testBackend = async () => {
      try {
        const containers = await invoke('list_containers');
        console.log('Containers:', containers);
      } catch (error) {
        console.error('Backend error:', error);
      }
    };
    testBackend();
  }, []);

  return (
    <div className="app">
      <NavBar onSection={setActiveSection} />
      <main className="main-content">
        {activeSection === "containers" ? <ContainerList /> : <ImageList />}
      </main>
    </div>
  );
}

export default App;
