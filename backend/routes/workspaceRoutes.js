const express = require("express");
const router = express.Router();

const {
    getWorkspaces,
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getMembers,
    addMember,
    updateMemberRole,
    removeMember,
} = require("../controllers/workspaceController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

// Get all workspaces the user owns or is a member of
router.get("/workspaces", authToken, authMiddleware, getWorkspaces);

// Create workspace
router.post("/workspaces", authToken, authMiddleware, createWorkspace);

// Get one workspace
router.get("/workspaces/:id", authToken, authMiddleware, getWorkspace);

// Rename workspace
router.put("/workspaces/:id", authToken, authMiddleware, updateWorkspace);

// Delete workspace (and every board in it)
router.delete("/workspaces/:id", authToken, authMiddleware, deleteWorkspace);

// Workspace members (sharing a workspace shares all of its boards)
router.get("/workspaces/:id/members", authToken, authMiddleware, getMembers);

router.post("/workspaces/:id/members", authToken, authMiddleware, addMember);

// Change a member's role (admin / member / viewer)
router.put("/workspaces/:id/members/:userId", authToken, authMiddleware, updateMemberRole);

router.delete("/workspaces/:id/members/:userId", authToken, authMiddleware, removeMember);

module.exports = router;
