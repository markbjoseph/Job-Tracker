import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./account.css";
import { resizeImage } from "./imageUtils";
import AccountMenu from "./AccountMenu";

function Account() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // profile picture as a data URL, null shows the default icon
    const [avatar, setAvatar] = useState(null);

    // hidden file input, opened by clicking the picture
    const fileInputRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // messages shown under each form
    const [profileMessage, setProfileMessage] = useState(null);
    const [emailMessage, setEmailMessage] = useState(null);

    // recent logins for "Recent devices"
    const [devices, setDevices] = useState([]);
    const [passwordMessage, setPasswordMessage] = useState(null);

    const getCurrentUser = async () => {

        const response = await fetch("http://localhost:3000/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        // not logged in (or token expired), go back to the login page
        if (!response.ok) {
            navigate("/");
            return;
        }

        const data = await response.json();

        setUsername(data.username);
        setEmail(data.email);
        setAvatar(data.avatar);
    };

    const getDevices = async () => {

        const response = await fetch("http://localhost:3000/me/devices", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setDevices(data);
    };

    useEffect(() => {
        getCurrentUser();
        getDevices();
    }, []);

    // turns a browser's user agent text into something readable, e.g. "Chrome on Windows"
    const describeDevice = (userAgent) => {

        let browser = "Unknown browser";
        if (/Edg\//.test(userAgent)) browser = "Edge";
        else if (/OPR\//.test(userAgent)) browser = "Opera";
        else if (/Chrome\//.test(userAgent)) browser = "Chrome";
        else if (/Firefox\//.test(userAgent)) browser = "Firefox";
        else if (/Safari\//.test(userAgent)) browser = "Safari";
        else if (/PostmanRuntime/.test(userAgent)) browser = "Postman";

        let system = "unknown device";
        if (/Windows/.test(userAgent)) system = "Windows";
        else if (/Android/.test(userAgent)) system = "Android";
        else if (/iPhone|iPad/.test(userAgent)) system = "iOS";
        else if (/Mac OS X/.test(userAgent)) system = "Mac";
        else if (/Linux/.test(userAgent)) system = "Linux";

        return `${browser} on ${system}`;
    };

    // the newest login from this same browser is marked "This device"
    const thisDeviceId = devices.find((device) => device.userAgent === navigator.userAgent)?.id;

    const updateProfile = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:3000/me", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            // picture is sent along with the username
            body: JSON.stringify({ username, avatar })
        });

        const data = await response.json();

        if (!response.ok) {
            setProfileMessage({ type: "error", text: data.message });
            return;
        }

        setUsername(data.username);
        setAvatar(data.avatar);
        setProfileMessage({ type: "success", text: "Profile saved" });
    };

    const updateEmail = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:3000/me", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            setEmailMessage({ type: "error", text: data.message });
            return;
        }

        setEmail(data.email);
        setEmailMessage({ type: "success", text: "Email updated" });
    };

    const changeAvatar = async (e) => {
        const file = e.target.files[0];

        // lets the same file be picked again later
        e.target.value = "";

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setProfileMessage({ type: "error", text: "Please choose an image file" });
            return;
        }

        try {
            // only preview it here, it's saved when they click Save changes
            const resized = await resizeImage(file);
            setAvatar(resized);
            setProfileMessage(null);
        } catch {
            setProfileMessage({ type: "error", text: "Couldn't read that image" });
        }
    };

    const updatePassword = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:3000/me/password", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            setPasswordMessage({ type: "error", text: data.message });
            return;
        }

        setCurrentPassword("");
        setNewPassword("");
        setPasswordMessage({ type: "success", text: data.message });
    };

    return (
        <div className="account-page">

            {/* account icon, top right */}
            <AccountMenu />

            <div className="account-page-container">

                <h1>Account</h1>

                {/* profile picture and username */}
                <form className="account-section" onSubmit={updateProfile}>

                    <h2>Profile</h2>

                    {/* profile picture and username on the same row */}
                    <div className="account-profile-row">

                        <div className="account-avatar-picker">
                            <button
                            type="button"
                            className="account-avatar-large"
                            aria-label="Change profile picture"
                            onClick={() => fileInputRef.current.click()}
                            >
                                {avatar ? (
                                    <img src={avatar} alt="Profile picture" />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
                                    </svg>
                                )}

                                <span className="account-avatar-overlay">Change</span>
                            </button>

                            {avatar && (
                                <button
                                type="button"
                                className="account-avatar-remove"
                                onClick={() => setAvatar(null)}
                                >
                                    Remove
                                </button>
                            )}

                            <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={changeAvatar}
                            />
                        </div>

                        <label className="account-username-field">
                            Username
                            <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            />
                        </label>

                    </div>

                    <button type="submit">Save changes</button>

                    {profileMessage && (
                        <p className={`account-message ${profileMessage.type}`}>{profileMessage.text}</p>
                    )}

                </form>

                {/* email and password together, each saved by its own form */}
                <div className="account-section">

                    <h2>Account security</h2>

                    <form className="account-subform" onSubmit={updateEmail}>

                        <h3>Change email</h3>

                        <label>
                            Email
                            <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            />
                        </label>

                        <button type="submit">Update email</button>

                        {emailMessage && (
                            <p className={`account-message ${emailMessage.type}`}>{emailMessage.text}</p>
                        )}

                    </form>

                    <div className="account-section-divider"></div>

                    <form className="account-subform" onSubmit={updatePassword}>

                        <h3>Change password</h3>

                        <label>
                            Current password
                            <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            />
                        </label>

                        <label>
                            New password
                            <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={6}
                            required
                            />
                        </label>

                        <button type="submit">Update password</button>

                        {passwordMessage && (
                            <p className={`account-message ${passwordMessage.type}`}>{passwordMessage.text}</p>
                        )}

                    </form>

                    <div className="account-section-divider"></div>

                    {/* where this account has logged in from recently */}
                    <h3>Recent devices</h3>

                    {devices.length === 0 ? (
                        <p className="account-devices-empty">No recent logins to show.</p>
                    ) : (
                        <ul className="account-devices">
                            {devices.map((device) => (
                                <li key={device.id}>
                                    <div className="account-device-name">
                                        {describeDevice(device.userAgent)}

                                        {device.id === thisDeviceId && (
                                            <span className="account-device-current">This device</span>
                                        )}
                                    </div>

                                    <div className="account-device-details">
                                        {new Date(device.createdAt).toLocaleString()}
                                        {device.ip && ` · ${device.ip}`}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Account;
