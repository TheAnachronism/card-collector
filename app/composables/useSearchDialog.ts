import { ref, shallowRef } from "vue";

const isOpen = ref(false);
const title = ref("");
const message = ref("");
const component = shallowRef<any>(null);
const props = ref<Record<string, any>>({});

function open(options: {
    component?: any;
    props?: Record<string, any>;
}) {
    component.value = options.component ?? null;
    props.value = options.props ?? {};
    isOpen.value = true;
}

function close() {
    isOpen.value = false;
}

export default function useDialog() {
    return { isOpen, title, message, component, props, open, close };
}
