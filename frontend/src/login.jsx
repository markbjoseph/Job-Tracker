import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    //creates two states
    //email = ""
    //password = ""
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        //sends a POST request to the backend
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            //if login is successful, navigate to the board page
            navigate("/board");
        } else {
            //if login fails, display an error message
            alert(data.message);
        }

        localStorage.setItem("token", data.token);

        console.log(data);
    };

    return (
        <div>
            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        //react updates the email state when user types into the email box 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                    />
                </div>

                <button type="submit">
                    Login
                </button>

            </form>
        </div>
    );
}

export default Login;