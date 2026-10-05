import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AccountMenu.css";

// round account icon in the top right corner, with the account menu under it
// used on the workspaces page and the boards page
function AccountMenu() {

    const navigate = useNavigate();

    const [showAccountMenu, setShowAccountMenu] = useState(false);

    // logged in user's username, email and picture, shown in the menu
    const [currentUser, setCurrentUser] = useState(null);

    const getCurrentUser = async () => {

        const response = await fetch("http://localhost:3000/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        setCurrentUser(data);
    };

    useEffect(() => {
        getCurrentUser();
    }, []);

    // clear the saved login and go back to the login page
    const switchAccounts = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="account-container"
        tabIndex={0}
        onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setShowAccountMenu(false);
            }
        }}
        >

            <button className="account-button" type="button" aria-label="Account"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            >
                {/* profile picture if they have one, otherwise the default icon */}
                {currentUser?.avatar ? (
                    <img className="avatar-image" src={currentUser.avatar} alt="Profile picture" />
                ) : (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
                    </svg>
                )}
            </button>

            {showAccountMenu && (
                <div className="account-menu">

                    <p className="account-menu-heading">Account</p>

                    {/* the logged in user */}
                    {currentUser && (
                        <div className="account-current">
                            <div className="account-avatar">
                                {currentUser.avatar ? (
                                    <img className="avatar-image" src={currentUser.avatar} alt="Profile picture" />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
                                    </svg>
                                )}
                            </div>

                            <div className="account-details">
                                <span className="account-username">{currentUser.username}</span>
                                <span className="account-email">{currentUser.email}</span>
                            </div>
                        </div>
                    )}

                    <button onClick={switchAccounts}>Switch accounts</button>
                    <button onClick={() => navigate("/account")}>Manage Account</button>

                    <button onClick={() => navigate("/workspaces")}>Manage workspace</button>

                    <div className="account-divider"></div>

                    <button onClick={switchAccounts}>Log out</button>
                </div>
            )}

        </div>
    );
}

export default AccountMenu;
