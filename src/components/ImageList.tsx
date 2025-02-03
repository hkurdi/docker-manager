import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Swal from "sweetalert2";
import "../styles/ImageList.css";

export const ImageList = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const result = await invoke<Image[]>("list_imgs");
      setImages(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const removeImage = async (img: string) => {
    try {
      await invoke("remove_img", { img });
      fetchImages();
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const runContainer = async (image: string) => {
    try {
      await invoke("create_container", { image });
    } catch (error) {
      console.error("Error running container:", error);
      Swal.fire({
        icon: "error",
        title: "Error", 
        text: "Image not found locally. Please pull the image first.",
        confirmButtonColor: "#2563eb"
      });
    }
  };

  if (loading) return <div className="loading">Loading images...</div>;

  return (
    <div className="image-list">
      <h2>Images</h2>
      <div className="image-grid">
        {images.map((image, index) => (
          <div key={index} className="image-card">
            <div className="image-header">
              <h3>{image.repo_tag || "Untagged"}</h3>
            </div>
            <div className="image-body">
              <p>Size: {(image.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div className="image-actions">
              <button
                className="action-button remove"
                onClick={() => removeImage(image.repo_tag)}
              >
                Remove
              </button>
              <button
                className="action-button run"
                onClick={() => runContainer(image.repo_tag)}
              >
                Run Container
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
