-- CreateTable
CREATE TABLE "_PetTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PetTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PetTags_B_index" ON "_PetTags"("B");

-- AddForeignKey
ALTER TABLE "_PetTags" ADD CONSTRAINT "_PetTags_A_fkey" FOREIGN KEY ("A") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PetTags" ADD CONSTRAINT "_PetTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
