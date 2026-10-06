import Login from "./login";
import Registration from "./registration";
import Board from "./board";
import Account from "./account";
import Workspaces from "./workspace";
import ManageWorkspace from "./manageWorkspace";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";



function App() {
    return (
        <Router>
            <Routes>

                <Route path="/" element={<Login />} />
                <Route path="/registration" element={<Registration />} />
                {/* workspaces are the first page after login, each one opens its boards */}
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/workspaces/:workspaceId" element={<Board />} />
                <Route path="/workspaces/:workspaceId/settings" element={<ManageWorkspace />} />

                {/* old link, boards now live inside a workspace */}
                <Route path="/board" element={<Navigate to="/workspaces" replace />} />
                <Route path="/account" element={<Account />} />
                <Route path="/manage-workspace" element={<ManageWorkspace />} />

            </Routes>
        </Router>
    );
}

export default App;