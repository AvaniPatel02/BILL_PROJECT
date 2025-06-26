import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [profileData, setProfileData] = useState({
        first_name: "",
        email: "",
        mobile: ""
    });
    const [images, setImages] = useState({
        image1: null,
        image2: null,
        image1Preview: null,
        image2Preview: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            
            const [userResponse, profileResponse] = await Promise.all([
                fetch("http://localhost:8000/api/auth/me/", {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch("http://localhost:8000/api/profile/", {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await userResponse.json();
            const profileData = profileResponse.ok ? await profileResponse.json() : {};

            setProfileData({
                first_name: userData.first_name || "",
                email: userData.email || "",
                mobile: userData.mobile || ""
            });

            setImages(prev => ({
                ...prev,
                image1Preview: profileData.image1_url || null,
                image2Preview: profileData.image2_url || null
            }));
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err.message || "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (imageKey) => (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImages(prev => ({
                ...prev,
                [imageKey]: file,
                [`${imageKey}Preview`]: previewUrl
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const token = localStorage.getItem("access_token");
            let formData = new FormData();
            
            // Add basic profile data
            formData.append("first_name", profileData.first_name);
            formData.append("mobile", profileData.mobile);
            
            // Add images if they exist
            if (images.image1) formData.append("image1", images.image1);
            if (images.image2) formData.append("image2", images.image2);

            // Use POST instead of PATCH if your backend doesn't support PATCH
            const response = await fetch("http://localhost:8000/api/profile/", {
                method: 'POST', // Changed from PATCH to POST
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type when using FormData - browser will set it automatically
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            setSuccess(true);
            setShowFileUpload(false);
            fetchProfile(); // Refresh data
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/", { replace: true }); // Redirect to login page
    };

    return (
        <div style={{ padding: "34px 55px 18px 128px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Profile</h2>
                <button className="btn btn-danger" onClick={handleLogout} style={{ minWidth: 100 }}>
                    Logout
                </button>
            </div>
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    Profile updated successfully!
                </div>
            )}

            {!showFileUpload ? (
                <div className="card p-4">
                    {/* <div className="text-center mb-3">
                        <img
                            src={images.image1Preview || "/images/default-profile.png"}
                            alt="Profile"
                            className="rounded-circle"
                            width="100"
                            height="100"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/images/default-profile.png";
                            }}
                        />
                    </div> */}
                    <div className="mb-3">
                        <label>Name</label>
                        <input
                            type="text"
                            name="first_name"
                            className="form-control"
                            placeholder="Enter Name"
                            value={profileData.first_name}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-3">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={profileData.email}
                            readOnly
                        />
                    </div>
                    <div className="mb-3">
                        <label>Mobile Number</label>
                        <input
                            type="text"
                            name="mobile"
                            className="form-control"
                            placeholder="Enter Mobile Number"
                            value={profileData.mobile}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="d-flex justify-content-center">
                    <button 
                        onClick={() => setShowFileUpload(true)} 
                        className="button-sumbit-banking btn-all text-center"
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Next"}
                    </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="card p-4">
                        <h5>Select Profile Picture - 1</h5>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange("image1")}
                            className="form-control mb-3"
                            disabled={loading}
                        />
                        {images.image1Preview && (
                            <div className="text-center mt-3">
                                <h6>Preview 1:</h6>
                                <img
                                    src={images.image1Preview}
                                    alt="Preview 1"
                                    className="img-thumbnail"
                                    style={{ objectFit: "contain", width: "100%", height: "200px" }}
                                />
                            </div>
                        )}

                        <h5 className="mt-4">Select Profile Picture - 2</h5>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange("image2")}
                            className="form-control mb-3"
                            disabled={loading}
                        />
                        {images.image2Preview && (
                            <div className="text-center mt-3">
                                <h6>Preview 2:</h6>
                                <img
                                    src={images.image2Preview}
                                    alt="Preview 2"
                                    className="img-thumbnail"
                                    style={{ objectFit: "contain", width: "100%", height: "200px" }}
                                />
                            </div>
                        )}

                        <div className="mt-4 d-flex justify-content-between">
                            <button
                                type="button"
                                className="action-btn back-btn"
                                onClick={() => setShowFileUpload(false)}
                                disabled={loading}
                            >
                               ← Back
                            </button>
                            <button
                                type="submit"
                                className="button-sumbit-banking btn-all"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Profile;