<script setup lang="ts">
import { authClient } from "@/lib/auth-client";

/* Icons (optional) */
import {
    Library,
    Search,
    FolderKanban,
    Settings,
    Menu,
    Plus,
    User,
    LogOut,
} from "lucide-vue-next";

/* Local state */
const mobileOpen = ref(false);

const primaryNav = [
    { label: "Collections", icon: Library, to: "/collections" },
    { label: "Search", icon: Search, to: "/search" },
    { label: "Decks", icon: FolderKanban, to: "/decks" },
    { label: "Settings", icon: Settings, to: "/settings" },
];

const authStore = useAuthStore();
</script>

<template>
    <SearchCards />
    <div
        class="relative z-10 flex min-h-dvh flex-col bg-background bg-gradient-to-b from-background via-background to-muted/60 text-foreground"
    >
        <!-- Sticky header -->
        <header
            class="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/55"
        >
            <div
                class="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 md:px-4"
            >
                <!-- Left: mobile menu button + logo -->
                <div class="flex items-center gap-2">
                    <Sheet v-model:open="mobileOpen">
                        <SheetTrigger as-child>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="md:hidden"
                                aria-label="Open navigation"
                            >
                                <Menu class="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" class="w-80 p-0">
                            <aside class="h-full flex flex-col">
                                <div
                                    class="px-4 py-3 border-b border-border flex items-center gap-2"
                                >
                                    <div
                                        class="size-7 rounded-md bg-primary/12 grid place-items-center"
                                    >
                                        <span class="text-primary font-bold"
                                            >Y</span
                                        >
                                    </div>
                                    <span class="font-semibold"
                                        >Yugioh Manager</span
                                    >
                                </div>
                                <ScrollArea class="flex-1">
                                    <nav class="p-2">
                                        <ul class="space-y-1">
                                            <li
                                                v-for="item in primaryNav"
                                                :key="item.to"
                                            >
                                                <NuxtLink
                                                    :to="item.to"
                                                    class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/30"
                                                    @click="mobileOpen = false"
                                                >
                                                    <component
                                                        :is="item.icon"
                                                        class="size-4"
                                                    />
                                                    <span>{{
                                                        item.label
                                                    }}</span>
                                                </NuxtLink>
                                            </li>
                                        </ul>
                                    </nav>
                                </ScrollArea>
                            </aside>
                        </SheetContent>
                    </Sheet>

                    <NuxtLink
                        to="/"
                        class="group flex items-center gap-2 rounded-md px-2 py-1"
                    >
                        <div
                            class="size-7 rounded-md bg-primary/12 grid place-items-center"
                        >
                            <span class="text-primary font-bold tracking-tight"
                                >Y</span
                            >
                        </div>
                        <span class="hidden text-sm font-semibold md:inline"
                            >Yugioh Manager</span
                        >
                    </NuxtLink>
                </div>

                <!-- Center: search -->
                <div class="px-1">
                    <div
                        class="relative group max-w-xl w-full mx-auto md:mx-0 md:w-[480px]"
                    >
                        <Search
                            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            type="search"
                            placeholder="Search cards, sets, archetypes…"
                            class="pl-9 pr-9 bg-muted/50 border-border placeholder:text-muted-foreground"
                        />
                        <kbd
                            class="absolute right-2 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-block"
                        >
                            /
                        </kbd>
                    </div>
                </div>

                <!-- Right: actions -->
                <ClientOnly fallback-tag="span">
                    <div class="flex items-center gap-1">
                        <Authenticated>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Quick add"
                                        >
                                            <Plus class="size-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"
                                        >Quick add</TooltipContent
                                    >
                                </Tooltip>
                            </TooltipProvider>
                        </Authenticated>

                        <!-- Loading state -->
                        <AuthLoading>
                            <Button
                                variant="ghost"
                                class="ml-1 flex items-center gap-2 px-2.5"
                                disabled
                            >
                                <Avatar class="size-6">
                                    <User class="size-6" />
                                </Avatar>
                                <span class="hidden text-sm md:inline"
                                    >Loading…</span
                                >
                            </Button>
                        </AuthLoading>

                        <!-- Authenticated state -->
                        <Authenticated>
                            <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <Button
                                        variant="ghost"
                                        class="ml-1 flex items-center gap-2 px-2.5"
                                    >
                                        <Avatar class="size-6">
                                            <AvatarImage
                                                v-if="authStore.userImage"
                                                :src="authStore.userImage"
                                                alt="User"
                                            />
                                            <AvatarFallback>
                                                <User class="size-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span
                                            class="hidden text-sm md:inline"
                                            >{{ authStore.userName }}</span
                                        >
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" class="w-48">
                                    <DropdownMenuLabel
                                        >Account</DropdownMenuLabel
                                    >
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <User class="mr-2 size-4" /> Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        class="text-red-400"
                                        @click="authClient.signOut()"
                                    >
                                        <LogOut class="mr-2 size-4" /> Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Authenticated>

                        <Unauthenticated>
                            <NuxtLink to="/login">
                                <Button variant="default" class="ml-1 px-3"
                                    >Sign in</Button
                                >
                            </NuxtLink>
                        </Unauthenticated>
                    </div>
                </ClientOnly>
            </div>
        </header>

        <!-- Main content area with optional desktop sidebar -->
        <div
            class="mx-auto grid w-7xl flex-1 grid-cols-1 md:grid-cols-[260px_1fr]"
        >
            <!-- Desktop sidebar -->
            <aside
                class="sticky top-[57px] hidden h-[calc(100dvh-57px)] md:block border-r border-border"
            >
                <ScrollArea class="h-full">
                    <nav class="p-3">
                        <p
                            class="mb-2 px-2 text-xs uppercase tracking-wide text-muted-foreground"
                        >
                            Navigation
                        </p>
                        <ul class="space-y-1">
                            <li v-for="item in primaryNav" :key="item.to">
                                <NuxtLink
                                    :to="item.to"
                                    class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/30"
                                    exact-active-class="bg-accent/35"
                                >
                                    <component :is="item.icon" class="size-4" />
                                    <span>{{ item.label }}</span>
                                </NuxtLink>
                            </li>
                        </ul>
                    </nav>
                </ScrollArea>
            </aside>

            <!-- Content -->
            <main class="relative z-10 p-3 md:p-6">
                <div class="mx-auto max-w-4xl">
                    <slot />
                </div>
            </main>
        </div>

        <!-- Mobile bottom nav -->
        <nav
            class="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/70 backdrop-blur"
        >
            <ul class="grid grid-cols-4">
                <li v-for="item in primaryNav" :key="item.to">
                    <NuxtLink
                        :to="item.to"
                        class="flex flex-col items-center gap-1 py-2 text-xs"
                        exact-active-class="text-primary"
                    >
                        <component :is="item.icon" class="size-5" />
                        {{ item.label }}
                    </NuxtLink>
                </li>
            </ul>
        </nav>
    </div>
</template>
