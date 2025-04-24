import { formatDistanceToNow } from "date-fns";

export function format(timestamp: number): string {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}
