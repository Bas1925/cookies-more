import { readCatalogFile, writeCatalogFile } from "../src/lib/catalog-fs";

/** Re-normalizes and rewrites data/catalog.json (handy after manual edits). */
const catalog = await readCatalogFile();
await writeCatalogFile(catalog);
console.log(
  `Normalized ${catalog.categories.length} categories, ${catalog.products.length} products`,
);
