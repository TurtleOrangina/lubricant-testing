import { inflateRawSync } from "node:zlib";

const END_OF_CENTRAL_DIR = 0x06054b50;
const CENTRAL_FILE_HEADER = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;

const STORED = 0;
const DEFLATED = 8;

/**
 * Reads the entries of a ZIP archive.
 *
 * An `.xlsx` file is a ZIP container, and neither Node nor this project ships a
 * ZIP library, so we walk the central directory by hand. Only the two
 * compression methods Excel emits (stored and deflate) are supported.
 */
export function readZipEntries(archive: Buffer): Map<string, Buffer> {
  const eocdOffset = findEndOfCentralDirectory(archive);
  const entryCount = archive.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = archive.readUInt32LE(eocdOffset + 16);

  if (centralDirOffset === 0xffffffff) {
    throw new Error("ZIP64 archives are not supported.");
  }

  const entries = new Map<string, Buffer>();
  let cursor = centralDirOffset;

  for (let i = 0; i < entryCount; i++) {
    if (archive.readUInt32LE(cursor) !== CENTRAL_FILE_HEADER) {
      throw new Error(`Corrupt ZIP: no central directory header at offset ${cursor}.`);
    }
    const compressionMethod = archive.readUInt16LE(cursor + 10);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const localHeaderOffset = archive.readUInt32LE(cursor + 42);
    const name = archive.toString("utf-8", cursor + 46, cursor + 46 + nameLength);

    entries.set(name, readEntryData(archive, localHeaderOffset, compressionMethod, compressedSize));
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function readEntryData(
  archive: Buffer,
  localHeaderOffset: number,
  compressionMethod: number,
  compressedSize: number,
): Buffer {
  if (archive.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER) {
    throw new Error(`Corrupt ZIP: no local file header at offset ${localHeaderOffset}.`);
  }
  const nameLength = archive.readUInt16LE(localHeaderOffset + 26);
  const extraLength = archive.readUInt16LE(localHeaderOffset + 28);
  const start = localHeaderOffset + 30 + nameLength + extraLength;
  const raw = archive.subarray(start, start + compressedSize);

  switch (compressionMethod) {
    case STORED:
      return raw;
    case DEFLATED:
      return inflateRawSync(raw);
    default:
      throw new Error(`Unsupported ZIP compression method ${compressionMethod}.`);
  }
}

function findEndOfCentralDirectory(archive: Buffer): number {
  // The record is at the very end unless the archive carries a trailing comment,
  // which caps the search at 64KiB plus the 22 byte record itself.
  const earliest = Math.max(0, archive.length - 0xffff - 22);
  for (let offset = archive.length - 22; offset >= earliest; offset--) {
    if (archive.readUInt32LE(offset) === END_OF_CENTRAL_DIR) return offset;
  }
  throw new Error("Not a ZIP archive: end of central directory record not found.");
}
