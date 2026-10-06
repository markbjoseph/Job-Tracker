import { useEffect, useState } from "react";
import "./ShareWorkspaceModal.css";

// what each role can do, shown in the Permissions part of a member's menu
const ROLE_OPTIONS = [
    { value: "admin", label: "Admin", description: "Edit everything and manage people" },
    { value: "member", label: "Member", description: "Create and edit boards, lists and cards" },
    { value: "viewer", label: "Viewer", description: "Can look but not change anything" },
];

const roleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || role;

// invite box, Members / Join requests tabs and the member list for one workspace
// shown inside the Share workspace pop-up and on the Manage workspace page
// (put it inside an element with the "share-modal" class for the dark styling)
function WorkspaceMembers({ workspaceId }) {

    const [owner, setOwner] = useState(null);
    const [members, setMembers] = useState([]);

    // the logged in user's role here ("owner", "admin", "member", "viewer") and their id
    const [myRole, setMyRole] = useState(null);
    const [myId, setMyId] = useState(null);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [memberError, setMemberError] = useState("");

    // which tab is showing under the invite box: "members" or "requests"
    const [tab, setTab] = useState("members");

    // id of the member whose options menu is open, null when closed
    const [menuUserId, setMenuUserId] = useState(null);

    // the owner and admins can invite people, change roles and remove people
    const canManage = myRole === "owner" || myRole === "admin";

    // sharing is per workspace, so everyone listed here can see every board in it
    const getMembers = async () => {

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}/members`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            setMemberError(data.message);
            return;
        }

        setOwner(data.owner);
        setMembers(data.members);
        setMyRole(data.myRole);
        setMyId(data.myId);
    };

    useEffect(() => {
        getMembers();
    }, [workspaceId]);

    const inviteMember = async (e) => {
        e.preventDefault();

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}/members`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: inviteEmail, role: inviteRole })
        });

        const data = await response.json();

        // show the error from the backend, e.g. "User not found"
        if (!response.ok) {
            setMemberError(data.message);
            return;
        }

        setMemberError("");
        setInviteEmail("");

        await getMembers();
    };

    const changeRole = async (userId, role) => {

        setMenuUserId(null);

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}/members/${userId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ role })
        });

        const data = await response.json();

        if (!response.ok) {
            setMemberError(data.message);
            return;
        }

        setMemberError("");

        // update just that person's role on screen
        setMembers((current) =>
            current.map((member) => (member.id === userId ? { ...member, role } : member))
        );

        // demoted yourself, so reload to hide controls you no longer have
        if (userId === myId) {
            await getMembers();
        }
    };

    const removeMember = async (member) => {

        setMenuUserId(null);

        const leaving = member.id === myId;

        if (!window.confirm(leaving
            ? "Leave this workspace? You'll lose access to all of its boards."
            : `Remove ${member.username} from this workspace?`)) {
            return;
        }

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}/members/${member.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            setMemberError(data.message);
            return;
        }

        setMemberError("");

        // left the workspace, so there's nothing here for them any more
        if (leaving) {
            window.location.href = "/workspaces";
            return;
        }

        await getMembers();
    };

    return (
        <>
        {/* only the owner and admins can invite */}
        {canManage && (
            <form className="share-form" onSubmit={inviteMember}>

                <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter an email to invite"
                required
                />

                {/* role the new person starts with */}
                <select
                className="share-role-select"
                aria-label="Role for the person you're inviting"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                >
                    {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <button type="submit">
                    Share
                </button>

            </form>
        )}

        {memberError && <p className="member-error">{memberError}</p>}

        {/* tabs: Members / Join requests */}
        <div className="share-tabs" role="tablist">
            <button
            type="button"
            role="tab"
            aria-selected={tab === "members"}
            className={`share-tab ${tab === "members" ? "active" : ""}`}
            onClick={() => setTab("members")}
            >
                Members
            </button>

            <button
            type="button"
            role="tab"
            aria-selected={tab === "requests"}
            className={`share-tab ${tab === "requests" ? "active" : ""}`}
            onClick={() => setTab("requests")}
            >
                Join requests
            </button>
        </div>

        {/* join requests aren't built yet, so this is always empty for now */}
        {tab === "requests" && (
            <p className="share-empty">No join requests.</p>
        )}

        {tab === "members" && (
        <ul className="members-list">

            {/* column labels */}
            <li className="members-columns">
                <span>Username</span>
                <span>Email</span>
                <span>Role</span>
                <span></span>
            </li>

            {owner && (
                <li>
                    <span>{owner.username}</span>
                    <span className="member-email">{owner.email}</span>
                    <span className="member-role">Owner</span>
                    <span></span>
                </li>
            )}

            {members.map((member) => {
                const isMe = member.id === myId;

                // managers get the full menu, everyone else only gets "Leave" on their own row
                const hasMenu = canManage || isMe;

                return (
                    <li key={member.id}>
                        <span>{member.username}{isMe && <span className="member-you"> (you)</span>}</span>
                        <span className="member-email">{member.email}</span>
                        <span className="member-role">{roleLabel(member.role)}</span>

                        {hasMenu ? (
                            <div
                            className="member-menu-container"
                            tabIndex={-1}
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setMenuUserId(null);
                                }
                            }}
                            >
                                <button
                                type="button"
                                className="member-menu-button"
                                aria-label={`Options for ${member.username}`}
                                onClick={() => setMenuUserId(menuUserId === member.id ? null : member.id)}
                                >
                                    ⋮
                                </button>

                                {menuUserId === member.id && (
                                    <div className="member-menu">

                                        {canManage && (
                                            <>
                                                <p className="member-menu-heading">Permissions</p>

                                                {ROLE_OPTIONS.map((option) => (
                                                    <button
                                                    key={option.value}
                                                    type="button"
                                                    className={`member-menu-role ${member.role === option.value ? "current" : ""}`}
                                                    onClick={() => changeRole(member.id, option.value)}
                                                    >
                                                        <span className="member-menu-check">
                                                            {member.role === option.value ? "✓" : ""}
                                                        </span>
                                                        <span>
                                                            <span className="member-menu-role-name">{option.label}</span>
                                                            <span className="member-menu-role-description">{option.description}</span>
                                                        </span>
                                                    </button>
                                                ))}

                                                <div className="member-menu-divider"></div>
                                            </>
                                        )}

                                        <button
                                        type="button"
                                        className="member-menu-remove"
                                        onClick={() => removeMember(member)}
                                        >
                                            {isMe ? "Leave workspace" : "Remove from workspace"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span></span>
                        )}
                    </li>
                );
            })}
        </ul>
        )}
        </>
    );
}

export default WorkspaceMembers;
