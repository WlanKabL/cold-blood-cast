import { User } from "./users";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
