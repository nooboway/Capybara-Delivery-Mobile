import { createHash } from "node:crypto";
import { objectStorageClient, ObjectStorageService } from "../lib/objectStorage";

const GAME_ORIGIN = "https://capybara-vibejam26.leocoout.dev";
const STORAGE_DIRECTORY = "capybara-game/p";
const OPAQUE_KEY = new TextEncoder().encode(
  "capy-2026-not-a-secret-just-opaque",
);
const storage = new ObjectStorageService();

type GameManifest = {
  packs: string[];
  eagerPacks: number;
  files: Record<string, [number, number, number]>;
};

function decodeOpaqueBytes(bytes: Uint8Array): Uint8Array {
  const decoded = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    decoded[index] = bytes[index] ^ OPAQUE_KEY[index % OPAQUE_KEY.length];
  }
  return decoded;
}

async function fetchBytes(path: string): Promise<Uint8Array> {
  const response = await fetch(new URL(path, GAME_ORIGIN));
  if (!response.ok) {
    throw new Error(`Source returned HTTP ${response.status} for ${path}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function resolvePublicBucket(): { bucketName: string; objectPrefix: string } {
  const searchPath = storage.getPublicObjectSearchPaths()[0];
  const parts = searchPath.replace(/^\/+|\/+$/g, "").split("/");
  const bucketName = parts.shift();
  if (!bucketName) {
    throw new Error("The public storage search path has no bucket name.");
  }
  return {
    bucketName,
    objectPrefix: [...parts, STORAGE_DIRECTORY].filter(Boolean).join("/"),
  };
}

function validateManifest(manifest: GameManifest): void {
  if (
    !Array.isArray(manifest.packs) ||
    manifest.packs.length === 0 ||
    manifest.packs.length > 64 ||
    !Number.isInteger(manifest.eagerPacks) ||
    manifest.eagerPacks < 0 ||
    !manifest.files ||
    typeof manifest.files !== "object"
  ) {
    throw new Error("The source returned an unexpected game asset manifest.");
  }
  for (const path of manifest.packs) {
    if (!/^\/p\/[a-f0-9]{10}\.bin$/i.test(path)) {
      throw new Error(`Rejected unexpected pack path: ${path}`);
    }
  }
}

async function main(): Promise<void> {
  const target = resolvePublicBucket();
  const bucket = objectStorageClient.bucket(target.bucketName);
  const encodedManifest = await fetchBytes("/p/m.bin");
  const decodedManifest = decodeOpaqueBytes(encodedManifest);
  const manifest = JSON.parse(
    new TextDecoder().decode(decodedManifest),
  ) as GameManifest;
  validateManifest(manifest);

  const rangesByPack = manifest.packs.map(() => [] as Array<[number, number]>);
  for (const [path, entry] of Object.entries(manifest.files)) {
    const [packIndex, offset, length] = entry;
    if (
      !Number.isInteger(packIndex) ||
      !Number.isInteger(offset) ||
      !Number.isInteger(length) ||
      packIndex < 0 ||
      packIndex >= manifest.packs.length ||
      offset < 0 ||
      length < 0
    ) {
      throw new Error(`Invalid manifest entry for ${path}`);
    }
    rangesByPack[packIndex].push([offset, length]);
  }

  const files = [
    { path: "/p/m.bin", bytes: encodedManifest, packIndex: null },
    ...manifest.packs.map((path, packIndex) => ({
      path,
      bytes: null as Uint8Array | null,
      packIndex,
    })),
  ];

  for (let index = 0; index < files.length; index += 1) {
    const entry = files[index];
    const name = entry.path.split("/").at(-1);
    if (!name) {
      throw new Error(`Invalid source path: ${entry.path}`);
    }
    const objectName = `${target.objectPrefix}/${name}`;
    const object = bucket.file(objectName);
    const bytes = entry.bytes ?? (await fetchBytes(entry.path));

    if (entry.packIndex !== null) {
      const decodedPack = decodeOpaqueBytes(bytes);
      const requiredBytes = Math.max(
        0,
        ...rangesByPack[entry.packIndex].map(([offset, length]) => offset + length),
      );
      if (requiredBytes > decodedPack.length) {
        throw new Error(
          `Pack ${name} is truncated: manifest needs ${requiredBytes} bytes, got ${decodedPack.length}.`,
        );
      }
    }

    await object.save(Buffer.from(bytes), {
      resumable: false,
      metadata: {
        contentType: "application/octet-stream",
        cacheControl:
          name === "m.bin"
            ? "public, max-age=60"
            : "public, max-age=31536000, immutable",
      },
    });
    const [metadata] = await object.getMetadata();
    if (Number(metadata.size) !== bytes.length) {
      throw new Error(`Stored object size mismatch for ${name}.`);
    }

    const checksum = createHash("sha256").update(bytes).digest("hex");
    console.log(
      `${index + 1}/${files.length} stored ${name}: ${bytes.length} bytes sha256=${checksum}`,
    );
  }

  console.log(
    `Stored manifest plus ${manifest.packs.length} packs covering ${Object.keys(manifest.files).length} media files.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
