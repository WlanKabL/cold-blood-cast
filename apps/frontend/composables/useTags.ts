import type { Tag } from "~/types/api";

export function useTags() {
    const api = useApi();
    const tags = ref<Tag[]>([]);

    async function fetchTags() {
        try {
            tags.value = await api.get<Tag[]>("/api/tags");
        } catch {
            tags.value = [];
        }
    }

    async function createTag(data: { name: string; category?: string; color?: string }) {
        const tag = await api.post<Tag>("/api/tags", data);
        tags.value.push(tag);
        return tag;
    }

    fetchTags();

    return { tags, fetchTags, createTag };
}
