export const authenticationService = {
    login: async (username: string, password: string): Promise<void> => {
        const { data } = await useHttp().post("/api/auth/login", {
            username,
            password,
        });
        return data;
    },
    register: async (username: string, password: string, onetimePassword: string): Promise<void> => {
        const { data } = await useHttp().post("/api/auth/register", {
            username,
            password,
        });
        return data;
    },
    logout: async (): Promise<void> => {
        await useHttp().post("/api/auth/logout");
    },
    getUser: async (): Promise<unknown> => {
        const { data } = await useHttp().get("/api/auth/user");
        return data;
    },
}