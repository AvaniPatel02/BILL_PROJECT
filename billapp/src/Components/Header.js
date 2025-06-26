import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Sidebar.css';

const Header = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://localhost:8000/api/profile/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <header className="header">
      <div className="header-left"></div>

      <div className="header-center">
        {profile?.image1_url ? (
          <img
            src={profile.image1_url}
            alt="Profile"
            className="profile-image"
            
          />
        ) : (
                <i className="bi bi-person-circle profile-icon"></i>
        )}
      </div>

      <div className="header-right" >
        <i className="fa-solid fa-users-gear profile-icon clickable"  title="Profile Setting"  onClick={() => navigate("/profile")}></i>
      </div>
    </header>
  );
};

export default Header;