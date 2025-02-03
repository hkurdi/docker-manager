import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Swal from "sweetalert2";
import { LogsViewer } from "./LogsViewer";
import "../styles/ContainerList.css";

interface Container {
  name?: string;
  status?: string;
  state?: string;
  ports?: string[];
}

export const ContainerList = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(
    null
  );
  const [newImage, setNewImage] = useState("");

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const result = await invoke<Container[]>("list_containers");
      setContainers(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching containers:", error);
    }
  };

  const stopContainer = async (name: string) => {
    try {
      await invoke("stop_container", { name });
      fetchContainers();
    } catch (error) {
      console.error("Error stopping container:", error);
    }
  };

  const killContainer = async (name: string) => {
    try {
      await invoke("kill_container", { name });
      fetchContainers();
    } catch (error) {
      console.error("Error killing container:", error);
    }
  };

  const createContainer = async (image: string) => {
    try {
      await invoke("create_container", { image });
      fetchContainers();
      setNewImage("");
    } catch (error) {
      console.error("Error creating container:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error', 
        text: 'Image not found locally. Please pull the image first.',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  if (loading) return <div className="loading">Loading containers...</div>;

  return (
    <div className="container-list">
      <h2>Containers</h2>
      <br />
      <div className="create-container">
        <input
          type="text"
          value={newImage}
          onChange={(e) => setNewImage(e.target.value)}
          placeholder="Enter image name to create container"
          className="image-input"
        />
        <button
          onClick={() => createContainer(newImage)}
          className="create-button"
        >
          Create Container
        </button>
      </div>
      <div className="container-grid">
        {containers.map((container, index) => (
          <div key={index} className="container-card">
            <div className="container-header">
              <h3>{container.name || "Unnamed"}</h3>
              <span className={`status ${container.state}`}>
                {container.state}
              </span>
            </div>
            <div className="container-body">
              <p>Status: {container.status}</p>
              {container.ports && <p>Ports: {container.ports.join(", ")}</p>}
            </div>
            <div className="container-actions">
              <button
                className="action-button stop"
                onClick={() => stopContainer(container.name!)}
              >
                Stop
              </button>
              <button
                className="action-button kill"
                onClick={() => killContainer(container.name!)}
              >
                Kill
              </button>
              <button
                className="action-button view-logs"
                onClick={() => setSelectedContainer(container.name!)}
              >
                View Logs
              </button>
            </div>
          </div>
        ))}
      </div>
      {selectedContainer && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setSelectedContainer(null)}
          />
          <div className="logs-modal">
            <button
              className="close-button"
              onClick={() => setSelectedContainer(null)}
            >
              ×
            </button>
            <LogsViewer containerName={selectedContainer} />
          </div>
        </>
      )}
    </div>
  );
};
