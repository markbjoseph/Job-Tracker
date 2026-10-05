import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./workspace.css";
import AccountMenu from "./AccountMenu";
import ShareWorkspaceModal from "./ShareWorkspaceModal";

// first page after logging in: every workspace the user owns or has been invited to
function Workspaces() {

    const navigate = useNavigate();

    const [workspaces, setWorkspaces] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // true while the "new workspace" box is showing
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");

    const [error, setError] = useState("");

    // id of the workspace whose Share pop-up is open, null when closed
    const [sharingId, setSharingId] = useState(null);

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

        setWorkspaces(await response.json());
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

    const createWorkspace = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:3000/workspaces", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: newName })
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message);
            return;
        }

        setError("");
        setNewName("");
        setCreating(false);

        // go straight into the new workspace
        navigate(`/workspaces/${data.id}`);
    };

    const deleteWorkspace = async (workspace) => {

        if (!window.confirm(`Delete "${workspace.name}" and every board in it?`)) {
            return;
        }

        const response = await fetch(`http://localhost:3000/workspaces/${workspace.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.message);
            return;
        }

        setWorkspaces((current) => current.filter((w) => w.id !== workspace.id));
    };

    return (
        <div className="workspaces-page">

            {/* account icon, top right */}
            <AccountMenu />

            <header className="workspaces-header">
                <h1>Workspaces</h1>
            </header>

            {error && <p className="workspaces-error">{error}</p>}

            <div className="workspaces-grid">

                {workspaces.map((workspace) => {
                    const isOwner = currentUser && workspace.ownerId === currentUser.id;

                    return (
                        <div
                        key={workspace.id}
                        className="workspace-tile"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/workspaces/${workspace.id}`)}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/workspaces/${workspace.id}`)}
                        >
                            <div className="workspace-tile-name">{workspace.name}</div>

                            <div className="workspace-tile-details">
                                {workspace._count.boards} {workspace._count.boards === 1 ? "board" : "boards"}
                                {" · "}
                                {workspace._count.members + 1} {workspace._count.members === 0 ? "person" : "people"}
                            </div>

                            {/* shared with you by someone else */}
                            {currentUser && !isOwner && (
                                <span className="workspace-tile-shared">
                                    Shared by {workspace.owner.username}
                                </span>
                            )}

                            <button
                            type="button"
                            className="workspace-tile-share"
                            onClick={(e) => {
                                // don't also open the workspace
                                e.stopPropagation();
                                setSharingId(workspace.id);
                            }}
                            >
                                Share
                            </button>

                            {isOwner && (
                                <button
                                type="button"
                                className="workspace-tile-delete"
                                aria-label={`Delete ${workspace.name}`}
                                onClick={(e) => {
                                    // don't also open the workspace
                                    e.stopPropagation();
                                    deleteWorkspace(workspace);
                                }}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    );
                })}

                {/* new workspace tile */}
                {creating ? (
                    <form className="workspace-tile workspace-new-form" onSubmit={createWorkspace}>
                        <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Workspace name"
                        autoFocus
                        required
                        />

                        <div className="workspace-new-actions">
                            <button type="submit">Create</button>
                            <button type="button" onClick={() => {
                                setCreating(false);
                                setNewName("");
                            }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                    type="button"
                    className="workspace-tile workspace-new"
                    onClick={() => setCreating(true)}
                    >
                        + New workspace
                    </button>
                )}

            </div>

            {sharingId && (
                <ShareWorkspaceModal
                workspaceId={sharingId}
                onClose={() => {
                    setSharingId(null);
                    // member counts on the tiles may have changed
                    getWorkspaces();
                }}
                />
            )}

        </div>
    );
}

export default Workspaces;
