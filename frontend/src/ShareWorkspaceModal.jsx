import WorkspaceMembers from "./WorkspaceMembers";
import "./modal.css";
import "./ShareWorkspaceModal.css";

// "Share workspace" pop-up: invite people by email, see and remove members
// used on the workspaces page and the boards page
function ShareWorkspaceModal({ workspaceId, onClose }) {

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

                <WorkspaceMembers workspaceId={workspaceId} />

            </div>
        </div>
    );
}

export default ShareWorkspaceModal;
