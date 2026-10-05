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
            // every new user starts with one workspace to put boards in
            workspaces: {
                create: { name: "My Workspace" },
            },
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

    // remember which browser/device this login came from, for "Recent devices"
    await prisma.loginEvent.create({
        data: {
            userId: user.id,
            userAgent: req.headers["user-agent"] || "Unknown device",
            ip: req.ip,
        },
    });

    res.status(200).json({ token });
};

// returns the logged in user's details (never the password)
const getMe = async (req, res) => {

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, username: true, email: true, avatar: true }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
};

// update the logged in user's username and/or email
const updateMe = async (req, res) => {
    const { username, email, avatar } = req.body;

    const data = {};

    // avatar is a small image data URL, or null to go back to the default icon
    if (avatar !== undefined) {
        if (avatar !== null && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar)) {
            return res.status(400).json({ message: "Profile picture must be an image" });
        }
        if (avatar && avatar.length > 200000) {
            return res.status(400).json({ message: "Profile picture is too large" });
        }
        data.avatar = avatar;
    }

    if (username !== undefined) {
        if (!username.trim()) {
            return res.status(400).json({ message: "Username can't be empty" });
        }
        data.username = username.trim();
    }

    if (email !== undefined) {
        if (!email.trim()) {
            return res.status(400).json({ message: "Email can't be empty" });
        }
        data.email = email.trim();
    }

    try {
        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data,
            select: { id: true, username: true, email: true, avatar: true }
        });

        res.status(200).json(user);
    } catch (error) {
        // P2002 = unique constraint failed, another account already has this email
        if (error.code === "P2002") {
            return res.status(409).json({ message: "That email is already in use" });
        }
        throw error;
    }
};

// change the logged in user's password, needs their current password first
const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
    });

    const isPasswordValid = await bcrypt.compare(currentPassword || "", user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: req.user.userId },
        data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated" });
};

// the most recent logins for the logged in user, newest first
const getDevices = async (req, res) => {

    const devices = await prisma.loginEvent.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, userAgent: true, ip: true, createdAt: true }
    });

    res.status(200).json(devices);
};

module.exports = {
    register,
    login,
    getMe,
    updateMe,
    updatePassword,
    getDevices,
};

// const auth = require("../middleware/auth");

// router.get("/boards", auth, boardController.getBoards);