import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SalaryManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    salary_name: "",
    salary_amount: "",
    salary_date: "",
    salary_email: "",
    salary_number: "",
  });
  const [salaryList, setSalaryList] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  // Helper functions
  const handleResponse = async (response) => {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Request failed");
    }
    return response.json();
  };

  const handleError = (error) => {
    console.error("Error:", error);
    setError(error.message || "An error occurred");
  };

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/banking/employee/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await handleResponse(response);
        setSalaryList(data);
      } catch (err) {
        handleError(err);
      }
    };

    fetchSalaries();
  }, [token]);

  const toggleForm = () => {
    setShowForm(!showForm);
    setFormData({
      salary_name: "",
      salary_amount: "",
      salary_date: "",
      salary_email: "",
      salary_number: "",
    });
    setIsEditing(false);
    setEditId(null);
    setSelectedPerson(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.salary_name,
      salary: formData.salary_amount,
      joining_date: formData.salary_date,
      email: formData.salary_email,
      number: formData.salary_number,
    };

    try {
      const url = isEditing
        ? `http://localhost:8000/api/employees/${editId}/`
        : "http://localhost:8000/api/banking/employee/";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await handleResponse(response);

      if (isEditing) {
        setSalaryList((prevList) =>
          prevList.map((item) => (item.id === editId ? data : item))
        );
      } else {
        setSalaryList([...salaryList, data]);
      }

      toggleForm();
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleEditClick = (person) => {
    setFormData({
      salary_name: person.name,
      salary_amount: person.salary,
      salary_date: person.joining_date,
      salary_email: person.email,
      salary_number: person.number,
    });
    setIsEditing(true);
    setEditId(person.id);
    setShowForm(true);
  };

  const handleNameClick = (person) => {
    navigate(`/employee-details/${person.id}`);
  };

  const handleCloseDetails = () => {
    setSelectedPerson(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/employees/${id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setSalaryList((prev) => prev.filter((item) => item.id !== id));
          alert("Entry deleted successfully.");
        } else {
          throw new Error("Failed to delete entry");
        }
      } catch (error) {
        handleError(error);
      }
    }
  };

  return (
    <div className="year_container">
      <h1 className="text-2xl font-bold mb-4">Salary Manager</h1>

      <button
        onClick={toggleForm}
        className="button-sumbit-banking btn-all"
      >
        {showForm ? "Cancel" : "Add Salary"}
      </button>

        {showForm ? (
        <form
          onSubmit={handleSubmit}
         className="form-container" 
        >
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              type="text"
              name="salary_name"
              required
              value={formData.salary_name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Salary Amount</label>
            <input
              type="number"
              name="salary_amount"
              required
              value={formData.salary_amount}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Joining Date</label>
            <input
              type="date"
              name="salary_date"
              required
              value={formData.salary_date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              name="salary_email"
              required
              value={formData.salary_email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Phone Number</label>
            <input
              type="text"
              name="salary_number"
              required
              value={formData.salary_number}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            className="button-sumbit-banking btn-all"
          >
            Submit
          </button>

          {error && <p className="text-red-500 mt-2">Error: {error}</p>}
        </form>
      ) : (
        <>
          {salaryList.length > 0 && (
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryList.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td
                      className="p-2 border text-blue-600 cursor-pointer underline"
                      onClick={() => handleNameClick(salary)}
                    >
                      {salary.name}
                    </td>
                    <td className="p-2 border">₹ {salary.salary}</td>
                    <td className="p-2 border">
                      {new Date(salary.joining_date).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">{salary.email}</td>
                    <td className="p-2 border">{salary.number}</td>
                    <td className="p-2 border space-x-2">
                    <div className="tooltip-container">
                      <button
                        onClick={() => handleEditClick(salary)}
                         className="action-btn edit"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <span className="tooltip-text">Edit</span>
                    </div>

                    <div className="tooltip-container">
                      <button
                        onClick={() => handleDelete(salary.id)}
                         className="action-btn delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                       </button>
                      <span className="tooltip-text">Delete</span>
                    </div>
                    
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedPerson && (
            <div className="mt-6 p-4 border rounded bg-gray-100 shadow">
              <h2 className="text-xl font-semibold mb-2">Salary Details</h2>
              <p><strong>Name:</strong> {selectedPerson.name}</p>
              <p><strong>Amount:</strong> ₹ {selectedPerson.salary}</p>
              <p><strong>Date:</strong> {new Date(selectedPerson.joining_date).toLocaleDateString()}</p>
              <p><strong>Email:</strong> {selectedPerson.email}</p>
              <p><strong>Phone:</strong> {selectedPerson.number}</p>
              <button
                onClick={handleCloseDetails}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close Details
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="text-red-500 mt-4">Error: {error}</p>}
    </div>
  );
};

export default SalaryManager;