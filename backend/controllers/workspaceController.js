const prisma = require("../thePrisma");
const { logActivity } = require("./activity");
const { ROLES, workspaceAccess, getWorkspaceRole, canAccessWorkspace, canManageMembers } = require("./boardAccess");

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

    const myRole = await getWorkspaceRole(req.user.userId, id);

    if (!myRole) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: { owner: { select: userFields } },
    });

    // myRole: "owner", "admin", "member" or "viewer"
    res.status(200).json({ ...workspace, myRole });
};

const createWorkspace = async (req, res) => {
    const name = (req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({ message: "Workspace name can't be empty" });
    }

    const workspace = await prisma.workspace.create({
        data: { name, ownerId: req.user.userId },
    });

    await logActivity(req.user.userId, workspace.id, "created", "workspace", workspace.name);

    res.status(201).json(workspace);
};

const updateWorkspace = async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, image } = req.body;

    const workspace = await prisma.workspace.findUnique({ where: { id } });

    // only the owner can change a workspace's name or picture
    if (!workspace || workspace.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Only the workspace owner can change it" });
    }

    // only update the fields that were sent
    const data = {};

    if (name !== undefined) {
        if (!name.trim()) {
            return res.status(400).json({ message: "Workspace name can't be empty" });
        }
        data.name = name.trim();
    }

    // image is a small image data URL, or null to remove it
    if (image !== undefined) {
        if (image !== null && !/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
            return res.status(400).json({ message: "Workspace picture must be an image" });
        }
        if (image && image.length > 200000) {
            return res.status(400).json({ message: "Workspace picture is too large" });
        }
        data.image = image;
    }

    const updated = await prisma.workspace.update({
        where: { id },
        data,
    });

    if (data.name !== undefined && data.name !== workspace.name) {
        await logActivity(req.user.userId, id, "updated", "workspace", updated.name, `renamed from "${workspace.name}"`);
    }

    if (data.image !== undefined && data.image !== workspace.image) {
        await logActivity(req.user.userId, id, "updated", "workspace", updated.name, data.image ? "changed the workspace picture" : "removed the workspace picture");
    }

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

    const myRole = await getWorkspaceRole(req.user.userId, id);

    if (!myRole) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
            owner: { select: userFields },
            members: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: userFields } }
            }
        }
    });

    res.status(200).json({
        owner: workspace.owner,
        // each member's details plus their role
        members: workspace.members.map((member) => ({ ...member.user, role: member.role })),
        // so the page knows whether to show invite / role / remove controls
        myRole,
        myId: req.user.userId,
    });
};

const addMember = async (req, res) => {
    const id = parseInt(req.params.id);
    const { email } = req.body;
    const role = req.body.role || "member";

    // the owner and admins can invite people
    if (!(await canManageMembers(req.user.userId, id))) {
        return res.status(403).json({ message: "Only the owner or an admin can invite members" });
    }

    if (!ROLES.includes(role)) {
        return res.status(400).json({ message: "Role must be admin, member or viewer" });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.id === workspace.ownerId) {
        return res.status(400).json({ message: "That person owns this workspace" });
    }

    try {
        await prisma.workspaceMember.create({
            data: { workspaceId: id, userId: user.id, role }
        });
    } catch (error) {
        // P2002 = unique constraint failed, so they're already a member
        if (error.code === "P2002") {
            return res.status(409).json({ message: "User is already a member" });
        }
        throw error;
    }

    await logActivity(req.user.userId, id, "added", "member", user.username, `as ${role}`);

    res.status(201).json({ id: user.id, username: user.username, email: user.email, role });
};

// change a member's role (admin / member / viewer)
const updateMemberRole = async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!(await canManageMembers(req.user.userId, id))) {
        return res.status(403).json({ message: "Only the owner or an admin can change roles" });
    }

    if (!ROLES.includes(role)) {
        return res.status(400).json({ message: "Role must be admin, member or viewer" });
    }

    // the owner isn't a member row, so this only ever changes invited people
    const result = await prisma.workspaceMember.updateMany({
        where: { workspaceId: id, userId },
        data: { role },
    });

    if (result.count === 0) {
        return res.status(404).json({ message: "That person isn't a member of this workspace" });
    }

    const changed = await prisma.user.findUnique({ where: { id: userId } });

    await logActivity(req.user.userId, id, "updated", "member", changed.username, `role changed to ${role}`);

    res.status(200).json({ userId, role });
};

const removeMember = async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // the owner and admins can remove anyone, everyone else can only remove themselves (leave)
    const canManage = await canManageMembers(req.user.userId, id);
    const isSelf = userId === req.user.userId;

    if (!canManage && !isSelf) {
        return res.status(403).json({ message: "Not allowed to remove this member" });
    }

    const removed = await prisma.workspaceMember.deleteMany({
        where: { workspaceId: id, userId }
    });

    if (removed.count > 0) {
        const person = await prisma.user.findUnique({ where: { id: userId } });

        await logActivity(req.user.userId, id, "removed", "member", person.username, isSelf ? "left the workspace" : null);
    }

    res.status(200).json({ message: "Member removed" });
};

// the most recent changes in a workspace, newest first (anyone in the workspace can see it)
const getActivity = async (req, res) => {
    const id = parseInt(req.params.id);

    if (!(await canAccessWorkspace(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const activity = await prisma.activity.findMany({
        where: { workspaceId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: userFields } },
    });

    res.status(200).json(activity);
};

module.exports = {
    getActivity,
    getWorkspaces,
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getMembers,
    addMember,
    updateMemberRole,
    removeMember,
};
