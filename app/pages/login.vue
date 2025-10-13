<!-- pages/login.vue -->
<script setup lang="ts">
import { Github, Loader2 } from "lucide-vue-next";

// Import your local shadcn-vue components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Use your existing Better Auth client
import { authClient } from "@/lib/auth-client";

definePageMeta({
  layout: "auth",
});

const pending = ref(false);
const error = ref<string | null>(null);

async function loginWithGithub() {
  await authClient.signIn.social({
    provider: "github",
  });
}
</script>

<template>
  <Card class="border-border bg-card">
    <CardHeader>
      <CardTitle class="text-lg">Sign in</CardTitle>
      <CardDescription> Use your GitHub account to continue. </CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <Button
        variant="outline"
        class="w-full justify-center gap-2"
        :disabled="pending"
        @click="loginWithGithub"
      >
        <Loader2 v-if="pending" class="size-4 animate-spin" />
        <Github v-else class="size-4" />
        <span>Continue with GitHub</span>
      </Button>

      <Separator />

      <p class="text-center text-xs text-muted-foreground">
        More providers coming soon.
      </p>

      <p
        v-if="error"
        class="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive"
      >
        {{ error }}
      </p>

      <p class="text-center text-[10px] text-muted-foreground">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </CardContent>
  </Card>
</template>
