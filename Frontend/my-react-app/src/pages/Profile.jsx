import React from "react";
import "./Profile.css";

const Profile = ({ user }) => {
  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.name?.charAt(0)}
          </div>
          <div className="profile-basic-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="divider"></div>

        {/* Details */}
        <div className="profile-details">
          <div className="detail-item">
            <span className="label">Full Name</span>
            <span className="value">{user?.name}</span>
          </div>

          <div className="detail-item">
            <span className="label">Email</span>
            <span className="value">{user?.email}</span>
          </div>

          <div className="detail-item">
            <span className="label">Account Type</span>
            <span className="value">User</span>
          </div>

          <div className="detail-item">
            <span className="label">Joined On</span>
            <span className="value">
              {new Date(user?.createdAt || Date.now()).toDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <button className="edit-btn">Edit Profile</button>
          <button className="change-btn">Change Password</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
