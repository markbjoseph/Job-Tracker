import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import WorkspaceMembers from "./WorkspaceMembers";
import { resizeImage } from "./imageUtils";
import "./account.css";
import "./manageWorkspace.css";

// settings page for one workspace, with a sidebar to switch between
// Members, Activity and Settings
function ManageWorkspace() {

    const navigate = useNavigate();

    // set when opened from a workspace's Settings option: /workspaces/:workspaceId/settings
    const { workspaceId } = useParams();

    const [workspace, setWorkspace] = useState(null);

    // every workspace the user owns or is in, for the dropdown
    const [workspaces, setWorkspaces] = useState([]);

    // logged in user, to know if they own this workspace
    const [currentUser, setCurrentUser] = useState(null);

    const [sideBarOpen, setSideBarOpen] = useState(true);

    // which sidebar section is showing: "members", "activity" or "settings"
    const [section, setSection] = useState("settings");

    // settings form: name and picture, saved together
    const [newName, setNewName] = useState("");
    const [newImage, setNewImage] = useState(null);

    // hidden file input, opened by clicking the picture
    const fileInputRef = useRef(null);
    const [settingsMessage, setSettingsMessage] = useState(null);

    const getWorkspaces = async () => {

        const response = await fetch("http://localhost:3000/workspaces", {
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

        setWorkspaces(data);

        // opened without a workspace (from the account menu), so show the first one
        if (!workspaceId && data.length > 0) {
            navigate(`/workspaces/${data[0].id}/settings`, { replace: true });
        }
    };

    const getCurrentUser = async () => {

        const response = await fetch("http://localhost:3000/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (response.ok) {
            setCurrentUser(await response.json());
        }
    };

    useEffect(() => {
        getWorkspaces();
        getCurrentUser();
    }, []);

    const getWorkspace = async () => {

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        // no access (or it was deleted), go back to the list of workspaces
        if (!response.ok) {
            navigate("/workspaces");
            return;
        }

        const data = await response.json();

        setWorkspace(data);
        setNewName(data.name);
        setNewImage(data.image);
        setSettingsMessage(null);
    };

    useEffect(() => {
        if (workspaceId) {
            getWorkspace();
        }
    }, [workspaceId]);

    const isOwner = workspace && currentUser && workspace.ownerId === currentUser.id;

    // only preview the picked picture here, it's saved with "Save changes"
    const changeImage = async (e) => {
        const file = e.target.files[0];

        // lets the same file be picked again later
        e.target.value = "";

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setSettingsMessage({ type: "error", text: "Please choose an image file" });
            return;
        }

        try {
            // wide crop so it can fill a whole workspace tile
            setNewImage(await resizeImage(file, 480, 270));
            setSettingsMessage(null);
        } catch {
            setSettingsMessage({ type: "error", text: "Couldn't read that image" });
        }
    };

    const saveSettings = async (e) => {
        e.preventDefault();

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            // picture is sent along with the name
            body: JSON.stringify({ name: newName, image: newImage })
        });

        const data = await response.json();

        if (!response.ok) {
            setSettingsMessage({ type: "error", text: data.message });
            return;
        }

        setWorkspace((current) => ({ ...current, name: data.name, image: data.image }));
        setNewImage(data.image);

        // keep the dropdown's name up to date too
        setWorkspaces((current) =>
            current.map((w) => (w.id === data.id ? { ...w, name: data.name, image: data.image } : w))
        );

        setSettingsMessage({ type: "success", text: "Workspace saved" });
    };

    const deleteWorkspace = async () => {

        if (!window.confirm(`Delete "${workspace.name}" and every board in it?`)) {
            return;
        }

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            setSettingsMessage({ type: "error", text: data.message });
            return;
        }

        navigate("/workspaces");
    };

    return (
        <div>

            {/* account icon, top right */}
            <AccountMenu />

            {/* sidebar */}
            <div className={`ws-sidebar ${sideBarOpen ? "open" : "closed"}`}>

                <div className="ws-sidebar-header">

                    {/* open/close icon, three horizontal lines */}
                    <svg
                    className="ws-sidebar-toggle"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    role="button"
                    aria-label="Toggle sidebar"
                    onClick={() => setSideBarOpen(!sideBarOpen)}
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>

                    {/* back to the list of all workspaces */}
                    {sideBarOpen && (
                        <button
                        type="button"
                        className="ws-sidebar-icon"
                        aria-label="Workspaces"
                        title="Workspaces"
                        onClick={() => navigate("/workspaces")}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                            </svg>
                        </button>
                    )}

                </div>

                {sideBarOpen && (
                    <div className="ws-sidebar-content">

                        {/* pick which workspace these settings are for */}
                        <select
                        className="ws-sidebar-picker"
                        aria-label="Workspace"
                        value={workspace ? workspace.id : ""}
                        onChange={(e) => navigate(`/workspaces/${e.target.value}/settings`)}
                        >
                            {!workspace && <option value="" disabled>Choose a workspace</option>}

                            {workspaces.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>

                        <nav className="ws-sidebar-nav">
                            <button
                            type="button"
                            className={`ws-sidebar-button ${section === "members" ? "selected" : ""}`}
                            onClick={() => setSection("members")}
                            >
                                Members
                            </button>

                            <button
                            type="button"
                            className={`ws-sidebar-button ${section === "activity" ? "selected" : ""}`}
                            onClick={() => setSection("activity")}
                            >
                                Activity
                            </button>

                            <button
                            type="button"
                            className={`ws-sidebar-button ${section === "settings" ? "selected" : ""}`}
                            onClick={() => setSection("settings")}
                            >
                                Settings
                            </button>
                        </nav>

                    </div>
                )}

            </div>

            {/* the selected section */}
            <main className={`ws-main ${sideBarOpen ? "sidebar-open" : "sidebar-closed"}`}>

                {section === "members" && workspace && (
                    // same box, header, invite box, tabs and list as the Share pop-up on the boards page
                    <div className="share-modal ws-members-panel">
                        <div className="share-header">
                            <h2>Share workspace</h2>
                        </div>

                        <WorkspaceMembers workspaceId={workspace.id} />
                    </div>
                )}

                {section === "activity" && (
                    <div className="account-section">
                        <h2>Activity</h2>

                        {/* activity isn't recorded yet, so this is a placeholder */}
                        <p className="account-devices-empty">No recent activity.</p>
                    </div>
                )}

                {section === "settings" && workspace && (
                    <>
                        <form className="account-section" onSubmit={saveSettings}>
                            <h2>Workspace Settings</h2>

                            {/* workspace picture and name on the same row */}
                            <div className="account-profile-row">

                                <div className="account-avatar-picker ws-image-field">
                                    <span className="ws-field-label">Workspace image</span>

                                    <button
                                    type="button"
                                    className="account-avatar-large ws-image-picker"
                                    aria-label="Change workspace picture"
                                    disabled={!isOwner}
                                    onClick={() => fileInputRef.current.click()}
                                    >
                                        {newImage ? (
                                            <img src={newImage} alt="Workspace picture" />
                                        ) : (
                                            // first letter of the name when there's no picture
                                            <span className="ws-image-letter">
                                                {(newName || "?").trim().charAt(0).toUpperCase()}
                                            </span>
                                        )}

                                        {isOwner && <span className="account-avatar-overlay">Change</span>}
                                    </button>

                                    {isOwner && newImage && (
                                        <button
                                        type="button"
                                        className="account-avatar-remove"
                                        onClick={() => setNewImage(null)}
                                        >
                                            Remove
                                        </button>
                                    )}

                                    <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={changeImage}
                                    />
                                </div>

                                <label className="account-username-field">
                                    Workspace name
                                    <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    disabled={!isOwner}
                                    required
                                    />
                                </label>

                            </div>

                            {isOwner ? (
                                <button type="submit">Save changes</button>
                            ) : (
                                <p className="account-devices-empty">
                                    Only the workspace owner can change these settings.
                                </p>
                            )}

                            {settingsMessage && (
                                <p className={`account-message ${settingsMessage.type}`}>{settingsMessage.text}</p>
                            )}
                        </form>

                        {/* deleting is owner only */}
                        {isOwner && (
                            <div className="account-section">
                                <h2>Delete workspace</h2>

                                <p className="account-devices-empty">
                                    Deletes this workspace and every board, list and card in it. This can't be undone.
                                </p>

                                <button type="button" className="ws-danger" onClick={deleteWorkspace}>
                                    Delete workspace
                                </button>
                            </div>
                        )}
                    </>
                )}

            </main>

        </div>
    );
}

export default ManageWorkspace;
