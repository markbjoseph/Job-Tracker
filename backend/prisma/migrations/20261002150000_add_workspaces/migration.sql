-- CreateTable
CREATE TABLE "Workspace" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- Backfill: every existing user gets a default workspace
INSERT INTO "Workspace" ("name", "ownerId")
SELECT 'My Workspace', "id" FROM "User";

-- AlterTable: add the column as optional first so existing boards can be filled in
ALTER TABLE "Board" ADD COLUMN "workspaceId" INTEGER;

-- Backfill: put each board into its owner's default workspace
UPDATE "Board" b
SET "workspaceId" = w."id"
FROM "Workspace" w
WHERE w."ownerId" = b."ownerId";

-- Every board now has a workspace, so the column can be required
ALTER TABLE "Board" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Backfill: people a board was shared with become members of the workspace that board is now in
INSERT INTO "WorkspaceMember" ("workspaceId", "userId")
SELECT DISTINCT b."workspaceId", bm."userId"
FROM "BoardMember" bm
JOIN "Board" b ON b."id" = bm."boardId"
ON CONFLICT ("workspaceId", "userId") DO NOTHING;

-- Board sharing is replaced by workspace sharing
ALTER TABLE "BoardMember" DROP CONSTRAINT "BoardMember_boardId_fkey";
ALTER TABLE "BoardMember" DROP CONSTRAINT "BoardMember_userId_fkey";
DROP TABLE "BoardMember";

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
