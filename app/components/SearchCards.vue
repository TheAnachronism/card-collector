<script setup lang="ts">
import useSearchDialog from "@/composables/useSearchDialog";

const searchDialog = useSearchDialog();

watch(searchDialog.isOpen, (newVal) => {
    console.log(newVal);
});
</script>

<template>
    <Dialog :v-model:open="searchDialog.isOpen" @close="searchDialog.close">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                </DialogDescription>
            </DialogHeader>

            <DialogFooter> Save changes </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
