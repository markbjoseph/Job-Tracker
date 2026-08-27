const bcrypt = require("bcrypt");
const prisma = require("../thePrisma");
const jwt = require("jsonwebtoken");

// Register a new user

//async allows function to use await 
//req.body when user fills out a registration form, the data is sent in the body of the request 
const register = async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        },
    });

    res.status(201).json(user);
};

//login an existing user 

const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1h" });

    res.status(200).json({ token });
};

module.exports = {
    register,
    login,
};

// const auth = require("../middleware/auth");

// router.get("/boards", auth, boardController.getBoards);