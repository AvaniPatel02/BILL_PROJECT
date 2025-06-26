import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const FilteredResults = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name") || "N/A";
  const date = queryParams.get("date") || "N/A";
  const country = queryParams.get("country") || "N/A";

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setIsAuthenticated(false);
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/auth/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const data = await response.json();
        setUserData(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth error:", err);
        setError("Authentication failed. Please log in again.");
        setIsAuthenticated(false);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return <div className="container mt-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirect handled above
  }

  return (
    <div className="container mt-4">
      {error && <div className="alert alert-danger">{error}</div>}
      <h2>Filtered Results</h2>
      <div className="card p-3">
        <p><strong>Authenticated User:</strong> {userData?.first_name || "Unknown"}</p>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Country:</strong> {country}</p>
      </div>
    </div>
  );
};

export default FilteredResults;
