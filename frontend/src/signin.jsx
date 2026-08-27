import { useState } from "react";

//change to registration page 
function SignIn() {

    //creates two states
    //email = ""
    //password = ""
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


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

            <form onSubmit={handleSubmit}>

                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                />

                <label htmlFor="email">Email Address</label>
                <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}  
                    placeholder="Enter your email address..."
                />

                <label htmlFor="password">Password</label>
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

            </form>

        </div>
    );
}

export default SignIn;