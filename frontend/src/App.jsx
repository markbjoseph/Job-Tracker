import Login from "./login";
import Registration from "./registration";
import Board from "./board";
import Account from "./account";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



function App() {
    return (
        <Router>
            <Routes>

                <Route path="/" element={<Login />} />
                <Route path="/registration" element={<Registration />} />
                <Route path="/board" element={<Board />} />
                <Route path="/account" element={<Account />} />

            </Routes>
        </Router>
    );
}

export default App;