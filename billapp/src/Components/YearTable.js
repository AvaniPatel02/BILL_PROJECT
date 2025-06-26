import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import './style/YearTable.css';


const YearTable = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const startYear = 2024;
  const endYear = currentYear + 1;
  const yearRanges = [];

  for (let year = startYear; year < endYear; year++) {
    yearRanges.push(`${year}-${year + 1}`);
  }

  // Function to fetch authenticated user info
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login"); // redirect if no token found
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      setError(err.message || "Failed to authenticate user");
      localStorage.removeItem("access_token");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center mt-5">
        {error}
      </div>
    );
  }

  return (
     <div className="year-bill-container">
      <div className="header-bar">
        <button
          onClick={() => navigate("/tax-invoice")}
          type="button"
          className="new-bill-btn" >
         <i className="fa-solid fa-plus"></i> New Bills
        </button>
      </div>

      <div className="bill-table-section">
        <h2>Year Bills</h2>
        <div  className="table-wrapper">
          <table className="year-table">
            <thead>
              <tr>
                <th>Year Range</th>
              </tr>
            </thead>
            <tbody>
              {yearRanges.map((yearRange) => (
                <tr
                  key={yearRange}
                  onClick={() => navigate(`/${yearRange}`)}
                   className="table-row"
                >
                  <td>
                    <span className="year-link">
                      <i className="bi bi-folder2"></i> <b>{yearRange}</b>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YearTable;
