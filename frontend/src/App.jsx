import Login from "./login";
import SignIn from "./signin";
import Board from "./board";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



function App() {
    return (
        <Router>
            <Routes>

                <Route path="/" element={<Login />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/board" element={<Board />} />

            </Routes>
        </Router>
    );
}

export default App;