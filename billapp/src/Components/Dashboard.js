import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Newscustomerchart from "./Newscustomerchart";
import "./Dashboard.css";

const Dashboard = () => {
  const [clientCount, setClientCount] = useState(0); //count total client 
  const [totalBillCount, setTotalBillCount] = useState(0); //count total bill of all client
  const [totalEmployees, setTotalEmployees] = useState(0); //count total employee 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //fot tottal client 
  useEffect(() => {
    const fetchClientCount = async () => {
      const token = localStorage.getItem("access_token");
      try {
        const response = await fetch("http://localhost:8000/api/grouped-invoices/", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
          }
          throw new Error("Failed to fetch client data");
        }

        const data = await response.json();
        setClientCount(data.length); // Total number of invoices (clients)
      } catch (err) {
        console.error(err);
        setError("Error fetching client count");
      }
    };

    fetchClientCount();
  }, [navigate]);

  //for total bills
  useEffect(() => {
    const fetchAllInvoices = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/grouped-invoices/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // full client list with invoices

        // Count total bills from all clients
        let count = 0;
        data.forEach(client => {
          count += client.invoices?.length || 0;
        });

        setTotalBillCount(count);
      } catch (err) {
        console.error("Error fetching invoice data:", err);
        setTotalBillCount(0);
      }
    };

    fetchAllInvoices();
  }, []);

  //count total employee
  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/banking/employee/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // Should be an array
        console.log("Employee Data:", data); // Optional: for debugging

        setTotalEmployees(data.length);
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setTotalEmployees(0);
      }
    };
    fetchEmployeeCount();
  }, []);


  const menuItems = [
    { label: "Bills", icon: "bi-receipt-cutoff", path: "/year-table" },
    { label: "Clients", icon: "bi-person-lines-fill", path: "/clients" },
    { label: "Address", icon: "bi-house-add-fill", path: "/address" },
    { label: "Accounting", icon: "bi-calculator-fill", path: "/billmanager" },
    { label: "Balance Sheet", icon: "bi-layout-text-sidebar-reverse", path: "/balancesheet" },
    // { label: "Balance Sheet 2", icon: "bi-layout-text-window-reverse", path: "/balancesheet2" },
    { label: "Banking", icon: "bi-bank2", path: "/banking" },
    { label: "Bank Add", icon: "bi-building-add", path: "/bankadd" },
    { label: "Buyer", icon: "bi-cart-fill", path: "/buyer" },
    { label: "Employee", icon: "bi-person-badge-fill", path: "/employee" },
    { label: "Income Expenditure", icon: "bi-wallet-fill", path: "/incomeExpenditure" },
  ];

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
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

      setLoading(false);
    } catch (err) {
      console.error("Token verification failed:", err);
      setError("Authentication failed. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [navigate]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const handleButtonClick = (path) => {
    navigate(path);
  };

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    title: {
      textalign: "start",
      marginbottom: "30px",
      color: "rgb(51, 51, 51)",
      fontsize: "20px",
      marginBottom: "20px"
    },

    chartContainer: {
      marginBottom: "40px",
      padding: "20px",

      borderRadius: "8px",
    },
    icon: {
      fontSize: "2rem",
      marginBottom: "10px",
      color: "#2e3a59",
    },
    label: {
      fontSize: "18px",
      fontWeight: "500",
      color: "#333",
    },

    heroSection: {
      marginBottom: "40px",
    },
    heroText: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "5px",
    },
    subText: {
      color: "#64748b",
      fontSize: "16px",
    },
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-danger mt-5">{error}</div>;
  }

  return (
    <>
      <Header />
      <div style={styles.container}>
        <h1 style={styles.title}>Dashboard</h1>

        {/* Uncomment to show chart */}
        {/* <div style={styles.chartContainer}>
          <h4 className="mb-3">Customer Overview</h4>
          <Newscustomerchart />
        </div> */}
    <div className="stats-container">
  {/* Clients */}
  <div className="stat-card bg-grey">
    {/* <i className="bi bi-people-fill stat-icon"></i> */}
      <img
      src="dash-client.gif"
      alt="Total Bills"
      className="stat-icon"
      style={{ height: "80px", marginBottom: "0px" }}
    />
    <div className="stat-value"> {clientCount} {error && <p className="text-danger">{error}</p>} </div>
    <div className="stat-label">Clients</div>
  </div>

  {/* Total Bills */}
  <div className="stat-card bg-green">
    <img
      src="https://cdn.dribbble.com/userupload/26806182/file/original-46e1551746edbbe3a03b91edf46663f8.gif"
      alt="Total Bills"
      className="stat-icon"
      style={{ height: "80px", marginBottom: "0px" }}
    />
    <div className="stat-value">{totalBillCount}</div>
    <div className="stat-label">Total Bills</div>
  </div>

  {/* Employees */}
  <div className="stat-card bg-yellow">
  <img
      src="https://www.xanikainfotech.com/assets/images/shapes/usside.gif"
      alt="Total Bills"
      className="stat-icon"
      style={{ height: "80px", marginBottom: "0px" }}
    />
    <div className="stat-value">{totalEmployees}</div>
    <div className="stat-label">Total Employee</div>
  </div>
</div>

        <div className="dashboard-buttons-container">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="dashboard-button"
              onClick={() => handleButtonClick(item.path)}
            >
              <i className={`bi ${item.icon}`} style={styles.icon}></i>
              <span style={styles.label}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
