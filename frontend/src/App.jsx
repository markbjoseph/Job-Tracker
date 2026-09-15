import Login from "./login";
import Registration from "./registration";
import Board from "./board";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



function App() {
    return (
        <Router>
            <Routes>

                <Route path="/" element={<Login />} />
                <Route path="/registration" element={<Registration />} />
                <Route path="/board" element={<Board />} />

            </Routes>
        </Router>
    );
}

export default App;