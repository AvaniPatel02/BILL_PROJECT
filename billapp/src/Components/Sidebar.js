import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import logo from './favicon.png';  // no longer needed because dynamic image
import './Sidebar.css';

const Header = () => {
  return <div></div>;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
    } else {
      // Fetch profile to get image2_url
      const fetchProfile = async () => {
        try {
          const response = await fetch("http://localhost:8000/api/profile/", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) throw new Error("Failed to fetch profile");

          const data = await response.json();
          setProfile(data);
          setLoading(false);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const menuItems = [
    { label: "Dashboard", icon: "bi-speedometer2", path: "/dashboard" },
    { label: "Bills", icon: "bi-receipt-cutoff", path: "/year-table" },
    { label: "Address", icon: "bi-house-add-fill", path: "/address" },
    { label: "Clients", icon: "bi-person-lines-fill", path: "/clients" },
    { label: "Accounting", icon: "bi-calculator-fill", path: "/billmanager" },
    { label: "Balance Sheet", icon: "bi-layout-text-sidebar-reverse", path: "/balancesheet" },
    { label: "Banking", icon: "bi-bank2", path: "/banking" },
    { label: "Settings", icon: "bi-gear-fill", path: "/setting" },
    // { label: "Profile", icon: "bi-person-circle", path: "/profile" },
  ];

  return (
    <div className="d-flex">
      <div className="sidebar-fixed">
        <div className="sidebar-header p-3 text-center">
          {profile?.image2_url ? (
            <img
              src={profile.image2_url}
              alt="Profile Logo"
              className="icon-image"
              style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
            />
          ) : (
            <div>No Logo Image</div>
          )}
        </div>
        <ul className="sidebar-nav list-unstyled">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <i className={`bi ${item.icon}`}></i> <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-grow-1">
        <Header />
        {/* Main content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
