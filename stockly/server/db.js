import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "stocksense.json");

function load() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { products: [] };
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const db = {
  get products() {
    return load().products;
  },
  set products(products) {
    const data = load();
    data.products = products;
    save(data);
  },
  run(fn) {
    const data = load();
    const result = fn(data);
    save(data);
    return result;
  },
};

export default db;
