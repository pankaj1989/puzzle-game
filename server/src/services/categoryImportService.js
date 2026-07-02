const XLSX = require("xlsx");
const Category = require("../models/Category");

const HEADER_ALIASES = {
  name: "name",
  ispremium: "isPremium",
  is_premium: "isPremium",
  premium: "isPremium",
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "_");
}

function parseBool(value) {
  if (value === undefined || value === null || value === "") return undefined;

  const s = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;

  return undefined;
}

function parseCategoriesWorkbookRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  if (!matrix.length) return [];

  const headerRow = matrix[0].map(normalizeHeader);

  const fieldIndexes = {};

  headerRow.forEach((header, idx) => {
    const field = HEADER_ALIASES[header];
    if (field) fieldIndexes[field] = idx;
  });

  for (const field of ["name", "isPremium"]) {
    if (fieldIndexes[field] === undefined) {
      throw new Error(`Missing required column: ${field}`);
    }
  }

  const rows = [];

  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i];

    if (!line || line.every((c) => String(c || "").trim() === "")) continue;

    const get = (field) => {
      const idx = fieldIndexes[field];
      return idx === undefined ? "" : String(line[idx] ?? "").trim();
    };

    rows.push({
      rowNumber: i + 1,
      name: get("name"),
      isPremium: get("isPremium"),
    });
  }

  return rows;
}

function validateRow(row) {
  const errors = [];

  if (!row.name) errors.push("name is required");
  if (!row.isPremium) errors.push("isPremium is required");

  const isPremium = parseBool(row.isPremium);

  if (row.isPremium !== "" && isPremium === undefined) {
    errors.push("isPremium must be true/false");
  }

  return {
    errors,
    parsed: {
      name: row.name,
      isPremium,
    },
  };
}

async function importCategoriesFromBuffer(buffer) {
  let rawRows;

  try {
    rawRows = parseCategoriesWorkbookRows(buffer);
  } catch (err) {
    return {
      created: 0,
      updated: 0,
      failed: 0,
      rows: [],
      errors: [
        {
          row: 0,
          message: err.message || "Could not parse file",
        },
      ],
    };
  }

  if (!rawRows.length) {
    return {
      created: 0,
      updated: 0,
      failed: 0,
      rows: [],
      errors: [
        {
          row: 0,
          message: "File has no category rows",
        },
      ],
    };
  }

  const categories = await Category.find();

  const categoryByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c])
  );

  const result = {
    created: 0,
    updated: 0,
    failed: 0,
    rows: [],
    errors: [],
  };

  for (const raw of rawRows) {
    const { errors, parsed } = validateRow(raw);

    if (errors.length) {
      result.failed++;

      result.errors.push({
        row: raw.rowNumber,
        name: raw.name || null,
        messages: errors,
      });

      continue;
    }

    try {
      const existing = categoryByName.get(parsed.name.toLowerCase());

      if (existing) {
        existing.name = parsed.name;
        existing.isPremium = parsed.isPremium;

        await existing.save();

        result.updated++;

        result.rows.push({
          row: raw.rowNumber,
          name: parsed.name,
          status: "updated",
        });
      } else {
        const category = await Category.create(parsed);

        categoryByName.set(category.name.toLowerCase(), category);

        result.created++;

        result.rows.push({
          row: raw.rowNumber,
          name: parsed.name,
          status: "created",
        });
      }
    } catch (err) {
      result.failed++;

      result.errors.push({
        row: raw.rowNumber,
        name: parsed.name,
        messages: [err.message || "Could not save category"],
      });
    }
  }

  return result;
}

module.exports = {
  importCategoriesFromBuffer,
  parseCategoriesWorkbookRows,
};