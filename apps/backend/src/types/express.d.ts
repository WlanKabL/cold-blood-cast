import type { User } from "@cold-blood-cast/shared";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
