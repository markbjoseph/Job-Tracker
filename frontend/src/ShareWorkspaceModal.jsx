import { useEffect, useState } from "react";
import "./modal.css";
import "./ShareWorkspaceModal.css";

// "Share workspace" pop-up: invite people by email, see and remove members
// used on the workspaces page and the boards page
function ShareWorkspaceModal({ workspaceId, onClose }) {

    const [owner, setOwner] = useState(null);
    const [members, setMembers] = useState([]);

    const [inviteEmail, setInviteEmail] = useState("");
    const [memberError, setMemberError] = useState("");

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
            body: JSON.stringify({ email: inviteEmail })
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

    const removeMember = async (userId) => {

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}/members/${userId}`, {
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

        await getMembers();
    };

    return (
        <div className="modal-overlay">
            <div className="modal share-modal">

                {/* title on the left, close on the top right */}
                <div className="share-header">
                    <h2>Share workspace</h2>

                    <button
                    type="button"
                    className="share-close"
                    aria-label="Close"
                    onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <form className="share-form" onSubmit={inviteMember}>

                    <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter an email to invite"
                    required
                    />

                    <button type="submit">
                        Share
                    </button>

                </form>

                {memberError && <p className="member-error">{memberError}</p>}

                <h3 className="members-heading">Members</h3>

                <ul className="members-list">

                    {/* column labels */}
                    <li className="members-columns">
                        <span>Username</span>
                        <span>Email</span>
                        <span></span>
                    </li>

                    {owner && (
                        <li>
                            <span>{owner.username}</span>
                            <span className="member-email">{owner.email}</span>
                            <span className="member-role">Owner</span>
                        </li>
                    )}

                    {members.map((member) => (
                        <li key={member.id}>
                            <span>{member.username}</span>
                            <span className="member-email">{member.email}</span>

                            <button onClick={() => removeMember(member.id)}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default ShareWorkspaceModal;
