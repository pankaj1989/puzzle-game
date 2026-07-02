const XLSX = require('xlsx');
const Category = require('../models/Category');
const Puzzle = require('../models/Puzzle');

const HEADER_ALIASES = {
  plate: 'plate',
  answer: 'answer',
  category: 'category',
  categoryname: 'category',
  category_name: 'category',
  categoryid: 'categoryId',
  category_id: 'categoryId',
  difficulty: 'difficulty',
  clue: 'clue',
  basepoints: 'basePoints',
  base_points: 'basePoints',
  timelimitseconds: 'timeLimitSeconds',
  time_limit_seconds: 'timeLimitSeconds',
  timelimit: 'timeLimitSeconds',
  ispremium: 'isPremium',
  is_premium: 'isPremium',
  premium: 'isPremium',
};

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '_');
}

function parseBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const s = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(s)) return true;
  if (['false', '0', 'no', 'n'].includes(s)) return false;
  return undefined;
}

function parseWorkbookRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!matrix.length) return [];

  const headerRow = matrix[0].map(normalizeHeader);
  const fieldIndexes = {};
  headerRow.forEach((header, idx) => {
    const field = HEADER_ALIASES[header];
    if (field) fieldIndexes[field] = idx;
  });

  const required = ['plate', 'answer', 'difficulty', 'clue'];
  const hasCategory = fieldIndexes.category !== undefined || fieldIndexes.categoryId !== undefined;
  if (!hasCategory) {
    throw new Error('Missing required column: category (or categoryId)');
  }
  for (const field of required) {
    if (fieldIndexes[field] === undefined) {
      throw new Error(`Missing required column: ${field}`);
    }
  }

  const rows = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const line = matrix[i];
    if (!line || line.every((cell) => String(cell || '').trim() === '')) continue;

    const get = (field) => {
      const idx = fieldIndexes[field];
      return idx === undefined ? '' : String(line[idx] ?? '').trim();
    };

    rows.push({
      rowNumber: i + 1,
      plate: get('plate'),
      answer: get('answer'),
      category: get('category'),
      categoryId: get('categoryId'),
      difficulty: get('difficulty').toLowerCase(),
      clue: get('clue'),
      basePoints: get('basePoints'),
      timeLimitSeconds: get('timeLimitSeconds'),
      isPremium: get('isPremium'),
    });
  }
  return rows;
}

function validateRow(row) {
  const errors = [];
  if (!row.plate) errors.push('plate is required');
  if (!row.answer) errors.push('answer is required');
  if (!row.clue) errors.push('clue is required');
  if (!row.category && !row.categoryId) errors.push('category or categoryId is required');
  if (!['easy', 'medium', 'hard'].includes(row.difficulty)) {
    errors.push('difficulty must be easy, medium, or hard');
  }

  let basePoints;
  if (row.basePoints !== '') {
    basePoints = Number(row.basePoints);
    if (!Number.isInteger(basePoints) || basePoints < 0) {
      errors.push('basePoints must be a non-negative integer');
    }
  }

  let timeLimitSeconds;
  if (row.timeLimitSeconds !== '') {
    timeLimitSeconds = Number(row.timeLimitSeconds);
    if (!Number.isInteger(timeLimitSeconds) || timeLimitSeconds < 5) {
      errors.push('timeLimitSeconds must be an integer of at least 5');
    }
  }

  const isPremium = parseBool(row.isPremium);
  if (row.isPremium !== '' && isPremium === undefined) {
    errors.push('isPremium must be true/false');
  }

  return {
    errors,
    parsed: {
      plate: row.plate,
      answer: row.answer,
      difficulty: row.difficulty,
      clue: row.clue,
      basePoints: basePoints ?? 100,
      timeLimitSeconds: timeLimitSeconds ?? 60,
      isPremium,
      categoryRef: row.categoryId || row.category,
    },
  };
}

function resolveCategory(ref, categoryByName, categoryById) {
  if (!ref) return null;
  if (/^[a-f0-9]{24}$/i.test(ref)) {
    return categoryById.get(ref.toLowerCase()) || null;
  }
  return categoryByName.get(ref.trim().toLowerCase()) || null;
}

async function importPuzzlesFromBuffer(buffer) {
  let rawRows;
  try {
    rawRows = parseWorkbookRows(buffer);
  } catch (err) {
    return {
      created: 0,
      updated: 0,
      failed: 0,
      rows: [],
      errors: [{ row: 0, message: err.message || 'Could not parse file' }],
    };
  }

  if (!rawRows.length) {
    return {
      created: 0,
      updated: 0,
      failed: 0,
      rows: [],
      errors: [{ row: 0, message: 'File has no puzzle rows' }],
    };
  }

  const categories = await Category.find().lean();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  const categoryById = new Map(categories.map((c) => [String(c._id), c]));

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
      result.failed += 1;
      result.errors.push({ row: raw.rowNumber, plate: raw.plate || null, messages: errors });
      continue;
    }

    const category = resolveCategory(parsed.categoryRef, categoryByName, categoryById);
    if (!category) {
      result.failed += 1;
      result.errors.push({
        row: raw.rowNumber,
        plate: parsed.plate,
        messages: [`Unknown category: ${parsed.categoryRef}`],
      });
      continue;
    }

    const doc = {
      plate: parsed.plate,
      answer: parsed.answer,
      categoryId: category._id,
      difficulty: parsed.difficulty,
      clue: parsed.clue,
      basePoints: parsed.basePoints,
      timeLimitSeconds: parsed.timeLimitSeconds,
      isPremium: parsed.isPremium ?? Boolean(category.isPremium),
    };

    try {
      const existing = await Puzzle.findOne({ plate: doc.plate.toUpperCase() });
      if (existing) {
        Object.assign(existing, doc);
        await existing.save();
        result.updated += 1;
        result.rows.push({ row: raw.rowNumber, plate: doc.plate, status: 'updated' });
      } else {
        await Puzzle.create(doc);
        result.created += 1;
        result.rows.push({ row: raw.rowNumber, plate: doc.plate, status: 'created' });
      }
    } catch (err) {
      result.failed += 1;
      result.errors.push({
        row: raw.rowNumber,
        plate: parsed.plate,
        messages: [err.message || 'Could not save puzzle'],
      });
    }
  }

  return result;
}

module.exports = { importPuzzlesFromBuffer, parseWorkbookRows };
