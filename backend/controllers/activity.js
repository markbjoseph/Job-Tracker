const prisma = require("../thePrisma");

// records one change in a workspace's activity log
//   logActivity(userId, workspaceId, "created", "card", "Call recruiter", 'on board "Applications"')
const logActivity = async (userId, workspaceId, action, targetType, targetName, details = null) => {

    // logging is extra, so a problem here should never undo or block the real change
    try {
        await prisma.activity.create({
            data: { userId, workspaceId, action, targetType, targetName, details },
        });
    } catch (error) {
        console.error("Couldn't save activity:", error);
    }
};

module.exports = { logActivity };
