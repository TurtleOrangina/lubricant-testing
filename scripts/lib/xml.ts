export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  /** Concatenated character data of this element, entity-decoded. */
  text: string;
}

const TAG =
  /<(\/?)([A-Za-z_][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->/g;
const ATTRIBUTE = /([A-Za-z_][\w.:-]*)\s*=\s*"([^"]*)"|([A-Za-z_][\w.:-]*)\s*=\s*'([^']*)'/g;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/**
 * Parses the subset of XML that OOXML parts use: elements, attributes and
 * character data, with no DTDs, CDATA sections or namespace resolution.
 * Element names keep whatever prefix they carry in the source.
 */
export function parseXml(source: string): XmlElement {
  const root: XmlElement = { name: "#document", attributes: {}, children: [], text: "" };
  const stack: XmlElement[] = [root];

  let cursor = 0;
  let match: RegExpExecArray | null;
  TAG.lastIndex = 0;

  while ((match = TAG.exec(source)) !== null) {
    const parent = stack[stack.length - 1]!;
    if (match.index > cursor) {
      parent.text += decodeEntities(source.slice(cursor, match.index));
    }
    cursor = TAG.lastIndex;

    const [, closing, name, rawAttributes, selfClosing] = match;
    if (name === undefined) continue; // Processing instruction or comment.

    if (closing === "/") {
      if (stack.length < 2) throw new Error(`Unexpected closing tag </${name}>.`);
      const open = stack.pop()!;
      if (open.name !== name) {
        throw new Error(`Mismatched XML tags: <${open.name}> closed by </${name}>.`);
      }
      continue;
    }

    const element: XmlElement = {
      name,
      attributes: parseAttributes(rawAttributes ?? ""),
      children: [],
      text: "",
    };
    parent.children.push(element);
    if (selfClosing !== "/") stack.push(element);
  }

  if (stack.length !== 1) {
    throw new Error(`Unclosed XML element <${stack[stack.length - 1]!.name}>.`);
  }
  return root;
}

/** Direct children with the given local name (namespace prefix ignored). */
export function childrenNamed(element: XmlElement, localName: string): XmlElement[] {
  return element.children.filter((child) => localNameOf(child) === localName);
}

/** First direct child with the given local name, or `undefined`. */
export function childNamed(element: XmlElement, localName: string): XmlElement | undefined {
  return element.children.find((child) => localNameOf(child) === localName);
}

export function localNameOf(element: XmlElement): string {
  const colon = element.name.indexOf(":");
  return colon === -1 ? element.name : element.name.slice(colon + 1);
}

/** Concatenated character data of an element and all its descendants. */
export function deepText(element: XmlElement): string {
  return element.text + element.children.map(deepText).join("");
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTRIBUTE.lastIndex = 0;
  while ((match = ATTRIBUTE.exec(source)) !== null) {
    const name = match[1] ?? match[3]!;
    attributes[name] = decodeEntities(match[2] ?? match[4]!);
  }
  return attributes;
}

function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (whole, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return ENTITIES[entity] ?? whole;
  });
}
