import { readFileSync } from "node:fs";
import { readZipEntries } from "./zip.ts";
import { childNamed, childrenNamed, deepText, parseXml, type XmlElement } from "./xml.ts";

export interface Cell {
  /** Column letters, e.g. `"B"` or `"AA"`. */
  column: string;
  row: number;
  /** Raw cell value; for shared strings this is already the resolved text. */
  value?: string;
  /** Formula source, without the leading `=`. */
  formula?: string;
  /** `true` when the value is text rather than a number. */
  isText: boolean;
  /** Background colour as `AARRGGBB`, when the style sets an explicit RGB. */
  fillRgb?: string;
  /** Font colour as `AARRGGBB`, when the style sets an explicit RGB. */
  fontRgb?: string;
}

export interface Sheet {
  name: string;
  rows: Map<number, Map<string, Cell>>;
  /** Highest row number that carries any cell. */
  lastRow: number;
}

export interface Workbook {
  sheets: Sheet[];
}

interface CellStyle {
  fillRgb?: string;
  fontRgb?: string;
}

export function readWorkbook(path: string): Workbook {
  const entries = readZipEntries(readFileSync(path));

  const sharedStrings = readSharedStrings(entries);
  const styles = readStyles(entries);
  const relationships = readRelationships(entries);

  const workbookXml = parseXml(requireEntry(entries, "xl/workbook.xml").toString("utf-8"));
  const sheetsElement = childNamed(workbookXml.children[0]!, "sheets");
  if (!sheetsElement) throw new Error("Workbook contains no <sheets> element.");

  const sheets = childrenNamed(sheetsElement, "sheet").map((element) => {
    const name = element.attributes["name"] ?? "(unnamed)";
    const relationshipId = element.attributes["r:id"];
    const target = relationshipId === undefined ? undefined : relationships.get(relationshipId);
    if (target === undefined) {
      throw new Error(`Sheet "${name}" has no resolvable worksheet relationship.`);
    }
    const xml = parseXml(requireEntry(entries, `xl/${target}`).toString("utf-8"));
    return readSheet(name, xml, sharedStrings, styles);
  });

  return { sheets };
}

export function sheetNamed(workbook: Workbook, name: string): Sheet {
  const sheet = workbook.sheets.find((candidate) => candidate.name === name);
  if (!sheet) {
    const available = workbook.sheets.map((s) => `"${s.name}"`).join(", ");
    throw new Error(`Workbook has no sheet named "${name}". Available sheets: ${available}.`);
  }
  return sheet;
}

export function cellAt(sheet: Sheet, row: number, column: string): Cell | undefined {
  return sheet.rows.get(row)?.get(column);
}

/** Trimmed text of a cell, or `""` when the cell is empty or missing. */
export function textAt(sheet: Sheet, row: number, column: string): string {
  return (cellAt(sheet, row, column)?.value ?? "").trim();
}

/**
 * Numeric value of a cell, or `undefined` when the cell is empty, missing or
 * holds text such as the `N/A` markers used for untested blocks.
 */
export function numberAt(sheet: Sheet, row: number, column: string): number | undefined {
  const cell = cellAt(sheet, row, column);
  if (!cell || cell.value === undefined || cell.value.trim() === "") return undefined;
  const value = Number(cell.value);
  return Number.isFinite(value) ? value : undefined;
}

function readSheet(
  name: string,
  xml: XmlElement,
  sharedStrings: string[],
  styles: CellStyle[],
): Sheet {
  const worksheet = xml.children[0]!;
  const sheetData = childNamed(worksheet, "sheetData");
  const rows = new Map<number, Map<string, Cell>>();
  let lastRow = 0;

  for (const rowElement of sheetData ? childrenNamed(sheetData, "row") : []) {
    const rowNumber = Number(rowElement.attributes["r"]);
    if (!Number.isFinite(rowNumber)) continue;
    const cells = new Map<string, Cell>();

    for (const cellElement of childrenNamed(rowElement, "c")) {
      const reference = cellElement.attributes["r"] ?? "";
      const column = reference.replace(/\d+/g, "");
      if (column === "") continue;

      const type = cellElement.attributes["t"];
      const valueElement = childNamed(cellElement, "v");
      const formulaElement = childNamed(cellElement, "f");
      const style = styles[Number(cellElement.attributes["s"] ?? "0")] ?? {};

      let value: string | undefined = valueElement ? deepText(valueElement) : undefined;
      if (type === "s" && value !== undefined) {
        value = sharedStrings[Number(value)] ?? "";
      } else if (type === "inlineStr") {
        const inline = childNamed(cellElement, "is");
        value = inline ? deepText(inline) : "";
      }

      cells.set(column, {
        column,
        row: rowNumber,
        ...(value !== undefined && { value }),
        ...(formulaElement && { formula: deepText(formulaElement) }),
        isText: type === "s" || type === "str" || type === "inlineStr",
        ...(style.fillRgb !== undefined && { fillRgb: style.fillRgb }),
        ...(style.fontRgb !== undefined && { fontRgb: style.fontRgb }),
      });
    }

    if (cells.size > 0) {
      rows.set(rowNumber, cells);
      lastRow = Math.max(lastRow, rowNumber);
    }
  }

  return { name, rows, lastRow };
}

function readSharedStrings(entries: Map<string, Buffer>): string[] {
  const entry = entries.get("xl/sharedStrings.xml");
  if (!entry) return [];
  const xml = parseXml(entry.toString("utf-8"));
  return childrenNamed(xml.children[0]!, "si").map(deepText);
}

function readStyles(entries: Map<string, Buffer>): CellStyle[] {
  const entry = entries.get("xl/styles.xml");
  if (!entry) return [];
  const styleSheet = parseXml(entry.toString("utf-8")).children[0]!;

  const fills = childNamed(styleSheet, "fills");
  const fillColours = (fills ? childrenNamed(fills, "fill") : []).map((fill) => {
    const pattern = childNamed(fill, "patternFill");
    // `none` and `gray125` carry no foreground colour and mean "unfilled".
    if (!pattern || pattern.attributes["patternType"] === "none") return undefined;
    return childNamed(pattern, "fgColor")?.attributes["rgb"];
  });

  const fonts = childNamed(styleSheet, "fonts");
  const fontColours = (fonts ? childrenNamed(fonts, "font") : []).map(
    // Theme and indexed colours are deliberately ignored: only an explicit RGB
    // is trustworthy enough to carry meaning.
    (font) => childNamed(font, "color")?.attributes["rgb"],
  );

  const cellXfs = childNamed(styleSheet, "cellXfs");
  return (cellXfs ? childrenNamed(cellXfs, "xf") : []).map((xf) => {
    const fillRgb = fillColours[Number(xf.attributes["fillId"] ?? "0")];
    const fontRgb = fontColours[Number(xf.attributes["fontId"] ?? "0")];
    return {
      ...(fillRgb !== undefined && { fillRgb }),
      ...(fontRgb !== undefined && { fontRgb }),
    };
  });
}

function readRelationships(entries: Map<string, Buffer>): Map<string, string> {
  const xml = parseXml(requireEntry(entries, "xl/_rels/workbook.xml.rels").toString("utf-8"));
  const map = new Map<string, string>();
  for (const relationship of childrenNamed(xml.children[0]!, "Relationship")) {
    const id = relationship.attributes["Id"];
    const target = relationship.attributes["Target"];
    if (id !== undefined && target !== undefined) map.set(id, target.replace(/^\.?\//, ""));
  }
  return map;
}

function requireEntry(entries: Map<string, Buffer>, name: string): Buffer {
  const entry = entries.get(name);
  if (!entry) throw new Error(`Workbook is missing the required part "${name}".`);
  return entry;
}
