import { useState } from "react";
import "../styles/Navbar.css";

export const NavBar = ({ onSection }: { onSection: (section: string) => void }) => {
  const [active, setActive] = useState("containers");
  
  const handleClick = (section: string) => {
    setActive(section);
    onSection(section);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">Docker Manager</div>
      <div className="nav-items">
        <button 
          className={`nav-item ${active === "containers" ? "active" : ""}`}
          onClick={() => handleClick("containers")}>
          Containers
        </button>
        <button 
          className={`nav-item ${active === "images" ? "active" : ""}`}
          onClick={() => handleClick("images")}>
          Images
        </button>
      </div>
    </nav>
  );
};
