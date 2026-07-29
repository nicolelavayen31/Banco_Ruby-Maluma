import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiConfig } from "../Docs/OpenApiConfig";

const docsRoutes = Router();

docsRoutes.use(
    "/",
    swaggerUi.serve
);

docsRoutes.get(
    "/",
    swaggerUi.setup(
        openApiConfig,
        {
            customSiteTitle:
                "BancoFuego API",
            swaggerOptions: {
                persistAuthorization:
                    true
            }
        }
    )
);

docsRoutes.get(
    "/openapi.json",
    (
        _req,
        res
    ): void => {
        res.status(200).json(
            openApiConfig
        );
    }
);

export { docsRoutes };