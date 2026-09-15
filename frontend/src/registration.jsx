import { useState } from "react";
import "./registration.css";
import { useNavigate } from "react-router-dom";



//change to registration page 
function Registration() {

    //creates two states
    //email = ""
    //password = ""
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();


        const handleSubmit = async (e) => {
        e.preventDefault();

        //sends a POST request to the backend
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        console.log(data);
    };

    
    return (
        <div>
            
        <h1>Register Your Account</h1>

            <div className="register-page">

                    <form 
                    onSubmit={handleSubmit}
                    className="register-container"
                    >

                        <label 
                        htmlFor="username"
                        className="label"
                        >
                            Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username..."
                        />

                        <label 
                        htmlFor="email"
                        className="label"
                        >
                        
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}  
                            placeholder="Enter your email address..."
                        />

                        <label 
                        htmlFor="password"
                        className="label"
                        >
                            Password
                        
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password..."
                        />

                            <button type="submit">
                            Sign Up 
                            </button>

                            <button
                            type="button"
                            onClick={() => navigate("/") }
                            >
                            I already have an account
                            </button>

                    </form>

            </div>

        </div>
    );
}

export default Registration;