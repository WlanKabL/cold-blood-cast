export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly code?: string,
    ) {
        super(message);
        this.name = "AppError";
    }
}

export function badRequest(message: string, code?: string): AppError {
    return new AppError(400, message, code);
}

export function unauthorized(message = "Unauthorized", code?: string): AppError {
    return new AppError(401, message, code);
}

export function forbidden(message = "Forbidden", code?: string): AppError {
    return new AppError(403, message, code);
}

export function notFound(message = "Not found", code?: string): AppError {
    return new AppError(404, message, code);
}

export function conflict(message: string, code?: string): AppError {
    return new AppError(409, message, code);
}

export function internal(message = "Internal server error", code?: string): AppError {
    return new AppError(500, message, code);
}
