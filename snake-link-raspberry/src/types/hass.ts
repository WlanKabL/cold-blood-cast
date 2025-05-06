export interface HassDevice {
    entity_id: string;
    state: string;
    attributes: Record<string, any>;
    last_changed: string;
    last_updated: string;
    context: {
        id: string;
        user_id: string | null;
    };
}
