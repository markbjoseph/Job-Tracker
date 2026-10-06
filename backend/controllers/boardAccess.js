const prisma = require("../thePrisma");

// member roles, from most to least allowed (the owner is above all of these)
//   admin  - edit everything and invite / remove people / change roles
//   member - create and edit boards, lists and cards
//   viewer - can only look
const ROLES = ["admin", "member", "viewer"];
const EDIT_ROLES = ["admin", "member"];

// "the user owns this workspace or it has been shared with them" (any role, so viewers too)
const workspaceAccess = (userId) => ({
    OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
    ]
});

// "the user owns this workspace or is an admin/member of it" (not viewers)
const workspaceEditAccess = (userId) => ({
    OR: [
        { ownerId: userId },
        { members: { some: { userId, role: { in: EDIT_ROLES } } } }
    ]
});

// "owner", "admin", "member", "viewer", or null if they have no access
const getWorkspaceRole = async (userId, workspaceId) => {

    if (!workspaceId) return null;

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { members: { where: { userId } } },
    });

    if (!workspace) return null;
    if (workspace.ownerId === userId) return "owner";

    return workspace.members[0]?.role || null;
};

// ---------- reading (any role) ----------

// Returns the workspace if the user owns it or is a member of it, otherwise null
const canAccessWorkspace = async (userId, workspaceId) => {

    if (!workspaceId) return null;

    return prisma.workspace.findFirst({
        where: { id: workspaceId, ...workspaceAccess(userId) }
    });
};

// Returns the board if the user can access the workspace it's in, otherwise null
const canAccessBoard = async (userId, boardId) => {

    if (!boardId) return null;

    return prisma.board.findFirst({
        where: {
            id: boardId,
            workspace: workspaceAccess(userId)
        }
    });
};

// Looks up which board a list belongs to, then checks access
const canAccessList = async (userId, listId) => {

    const list = await prisma.list.findUnique({ where: { id: listId } });

    if (!list) return null;

    return canAccessBoard(userId, list.boardId);
};

// ---------- changing things (owner, admin, member - not viewers) ----------

const canEditWorkspace = async (userId, workspaceId) => {

    if (!workspaceId) return null;

    return prisma.workspace.findFirst({
        where: { id: workspaceId, ...workspaceEditAccess(userId) }
    });
};

const canEditBoard = async (userId, boardId) => {

    if (!boardId) return null;

    return prisma.board.findFirst({
        where: {
            id: boardId,
            workspace: workspaceEditAccess(userId)
        }
    });
};

const canEditList = async (userId, listId) => {

    const list = await prisma.list.findUnique({ where: { id: listId } });

    if (!list) return null;

    return canEditBoard(userId, list.boardId);
};

const canEditCard = async (userId, cardId) => {

    const card = await prisma.card.findUnique({ where: { id: cardId } });

    if (!card) return null;

    return canEditList(userId, card.listId);
};

// ---------- managing people (owner, admin) ----------

const canManageMembers = async (userId, workspaceId) => {
    const role = await getWorkspaceRole(userId, workspaceId);
    return role === "owner" || role === "admin";
};

module.exports = {
    ROLES,
    workspaceAccess,
    getWorkspaceRole,
    canAccessWorkspace,
    canAccessBoard,
    canAccessList,
    canEditWorkspace,
    canEditBoard,
    canEditList,
    canEditCard,
    canManageMembers,
};
