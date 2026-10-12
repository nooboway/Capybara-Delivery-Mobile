import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import { ObjectStorageService } from "../lib/objectStorage";

const GAME_ORIGIN = "https://capybara-vibejam26.leocoout.dev";
const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

async function proxySponsorRequest(req: Request, res: Response) {
  try {
    const upstream = await fetch(new URL(req.originalUrl, GAME_ORIGIN));
    if (!upstream.ok) {
      res.sendStatus(upstream.status);
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    res
      .status(200)
      .type(upstream.headers.get("content-type") ?? "application/octet-stream")
      .set(
        "Cache-Control",
        req.path === "/sponsor"
          ? "public, max-age=60"
          : "public, max-age=86400",
      )
      .send(body);
  } catch (error) {
    logger.error(
      { err: error, path: req.originalUrl },
      "Could not reach the original sponsor endpoint",
    );
    res.status(502).json({ error: "Sponsor data is temporarily unavailable." });
  }
}

router.get("/sponsor", proxySponsorRequest);
router.get("/sponsor/img/:id", (req, res) => {
  if (!/^[a-f0-9-]{36}$/i.test(req.params["id"])) {
    res.sendStatus(404);
    return;
  }
  return proxySponsorRequest(req, res);
});

router.get("/game-assets/:file", async (req, res) => {
  const file = req.params["file"];
  if (!/^(?:m|[a-f0-9]{10})\.bin$/i.test(file)) {
    res.sendStatus(404);
    return;
  }

  try {
    const storedFile = await objectStorageService.searchPublicObject(
      `capybara-game/p/${file}`,
    );
    if (!storedFile) {
      logger.error({ file }, "Game asset is missing from App Storage");
      res.status(503).json({ error: "The stored game assets are unavailable." });
      return;
    }

    const [metadata] = await storedFile.getMetadata();
    res
      .status(200)
      .type((metadata.contentType as string) ?? "application/octet-stream")
      .set(
        "Cache-Control",
        file === "m.bin"
          ? "public, max-age=60"
          : "public, max-age=31536000, immutable",
      )
      .set("Content-Length", String(metadata.size ?? 0));

    const stream = storedFile.createReadStream();
    stream.on("error", (error) => {
      logger.error({ err: error, file }, "Could not read game asset from App Storage");
      if (!res.headersSent) {
        res.status(503).json({ error: "The stored game assets are unavailable." });
      } else {
        res.destroy(error);
      }
    });
    stream.pipe(res);
  } catch (error) {
    logger.error({ err: error, file }, "Could not reach App Storage for game asset");
    res.status(503).json({ error: "The stored game assets are unavailable." });
  }
});

export default router;
