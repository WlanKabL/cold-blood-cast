import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Snake-Link API",
            version: "1.0.0",
        },
    },
    apis: ["./src/routes/**/*.ts"], // Pfade zu Dateien mit JSDoc-Kommentaren
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiHandler = swaggerUi.serve;
export const swaggerDocsHandler = swaggerUi.setup(swaggerSpec);
