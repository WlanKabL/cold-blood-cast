import { Router, type Request, type Response, type NextFunction } from "express";
import { getPublishedLegalDocuments, getLegalDocumentByKey } from "../../services/legal.service.js";
import { paramString } from "../../utils/params.js";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const docs = await getPublishedLegalDocuments();
        res.json(docs);
    } catch (err) {
        next(err);
    }
});

router.get("/:key", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = paramString(req, "key");
        const doc = await getLegalDocumentByKey(key);
        res.json(doc);
    } catch (err) {
        next(err);
    }
});

export default router;
