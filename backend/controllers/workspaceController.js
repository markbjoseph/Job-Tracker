const prisma = require("../thePrisma");
const { workspaceAccess, canAccessWorkspace } = require("./boardAccess");

const userFields = { id: true, username: true, email: true, avatar: true };


// all workspaces the user owns or has been invited to
const getWorkspaces = async (req, res) => {

    const workspaces = await prisma.workspace.findMany({
        where: workspaceAccess(req.user.userId),
        orderBy: { createdAt: "asc" },
        include: {
            owner: { select: userFields },
            _count: { select: { boards: true, members: true } },
        },
    });

    res.status(200).json(workspaces);
};

// one workspace, used for the name at the top of the boards page
const getWorkspace = async (req, res) => {
    const id = parseInt(req.params.id);

    if (!(await canAccessWorkspace(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: { owner: { select: userFields } },
    });

    res.status(200).json(workspace);
};

const createWorkspace = async (req, res) => {
    const name = (req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({ message: "Workspace name can't be empty" });
    }

    const workspace = await prisma.workspace.create({
        data: { name, ownerId: req.user.userId },
    });

    res.status(201).json(workspace);
};

const updateWorkspace = async (req, res) => {
    const id = parseInt(req.params.id);
    const name = (req.body.name || "").trim();

    const workspace = await prisma.workspace.findUnique({ where: { id } });

    // only the owner can rename a workspace
    if (!workspace || workspace.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Only the workspace owner can rename it" });
    }

    if (!name) {
        return res.status(400).json({ message: "Workspace name can't be empty" });
    }

    const updated = await prisma.workspace.update({
        where: { id },
        data: { name },
    });

    res.status(200).json(updated);
};

const deleteWorkspace = async (req, res) => {
    const id = parseInt(req.params.id);

    const workspace = await prisma.workspace.findUnique({ where: { id } });

    // only the owner can delete a workspace
    if (!workspace || workspace.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Only the workspace owner can delete it" });
    }

    // cards and lists don't cascade, so clear them first
    // (boards and members cascade automatically when the workspace is deleted)
    await prisma.$transaction([
        prisma.card.deleteMany({ where: { list: { board: { workspaceId: id } } } }),
        prisma.list.deleteMany({ where: { board: { workspaceId: id } } }),
        prisma.workspace.delete({ where: { id } }),
    ]);

    res.status(200).json(workspace);
};

const getMembers = async (req, res) => {
    const id = parseInt(req.params.id);

    if (!(await canAccessWorkspace(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
            owner: { select: userFields },
            members: {
                include: { user: { select: userFields } }
            }
        }
    });

    res.status(200).json({
        owner: workspace.owner,
        members: workspace.members.map((member) => member.user)
    });
};

const addMember = async (req, res) => {
    const id = parseInt(req.params.id);
    const { email } = req.body;

    const workspace = await prisma.workspace.findUnique({ where: { id } });

    // only the owner can invite people
    if (!workspace || workspace.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Only the workspace owner can invite members" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.id === workspace.ownerId) {
        return res.status(400).json({ message: "You already own this workspace" });
    }

    try {
        await prisma.workspaceMember.create({
            data: { workspaceId: id, userId: user.id }
        });
    } catch (error) {
        // P2002 = unique constraint failed, so they're already a member
        if (error.code === "P2002") {
            return res.status(409).json({ message: "User is already a member" });
        }
        throw error;
    }

    res.status(201).json({ id: user.id, username: user.username, email: user.email });
};

const removeMember = async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    const workspace = await prisma.workspace.findUnique({ where: { id } });

    // owner can remove anyone, members can only remove themselves (leave)
    const isOwner = workspace && workspace.ownerId === req.user.userId;
    const isSelf = userId === req.user.userId;

    if (!workspace || (!isOwner && !isSelf)) {
        return res.status(403).json({ message: "Not allowed to remove this member" });
    }

    await prisma.workspaceMember.deleteMany({
        where: { workspaceId: id, userId }
    });

    res.status(200).json({ message: "Member removed" });
};

module.exports = {
    getWorkspaces,
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getMembers,
    addMember,
    removeMember,
};
