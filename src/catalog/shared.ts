import type {
  BitCatalogResolution,
  BitCatalogSummary,
  FindBitsOptions,
} from "./contracts";
import { sharedBitInventory } from "./inventory.generated";

const normalizeText = (value: string): string => value.trim().toLowerCase();

const tokenizeQuery = (value: string): string[] =>
  Array.from(new Set(normalizeText(value).split(/\s+/).filter(Boolean)));

const cloneSummary = (entry: BitCatalogSummary): BitCatalogSummary => ({
  ...entry,
  tags: [...entry.tags],
  componentNames: [...entry.componentNames],
  registryDependencies: [...entry.registryDependencies],
  helpers: [...entry.helpers],
});

const normalizeTags = (tags: string[] | undefined): string[] =>
  Array.from(
    new Set((tags ?? []).map((tag) => normalizeText(tag)).filter(Boolean)),
  );

const validateLimit = (limit: number | undefined): number | undefined => {
  if (limit === undefined) {
    return undefined;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("findBits limit must be a positive integer.");
  }

  return limit;
};

const filterByTags = (
  entries: BitCatalogSummary[],
  tags: string[],
): BitCatalogSummary[] => {
  if (tags.length === 0) {
    return entries;
  }

  return entries.filter((entry) => {
    const entryTags = entry.tags.map(normalizeText);
    return tags.every((tag) => entryTags.includes(tag));
  });
};

const scoreBitCatalogEntry = (
  entry: BitCatalogSummary,
  query: string,
): number => {
  if (!query) {
    return 0;
  }

  const terms = tokenizeQuery(query);
  const normalizedId = normalizeText(entry.id);
  const normalizedName = normalizeText(entry.name);
  const normalizedDescription = normalizeText(entry.description);
  const normalizedTags = entry.tags.map(normalizeText);
  const normalizedDependencies = entry.registryDependencies.map(normalizeText);
  const normalizedHelpers = entry.helpers.map(normalizeText);

  let score = 0;

  if (normalizedId === query) {
    score += 1400;
  } else if (normalizedId.includes(query)) {
    score += 500;
  }

  if (normalizedName === query) {
    score += 1200;
  } else if (normalizedName.startsWith(query)) {
    score += 800;
  } else if (normalizedName.includes(query)) {
    score += 650;
  }

  if (normalizedTags.some((tag) => tag === query)) {
    score += 420;
  } else if (normalizedTags.some((tag) => tag.includes(query))) {
    score += 280;
  }

  if (normalizedDescription.includes(query)) {
    score += 240;
  }

  if (normalizedDependencies.some((dependency) => dependency === query)) {
    score += 200;
  } else if (
    normalizedDependencies.some((dependency) => dependency.includes(query))
  ) {
    score += 120;
  }

  if (normalizedHelpers.some((helper) => helper === query)) {
    score += 200;
  } else if (normalizedHelpers.some((helper) => helper.includes(query))) {
    score += 120;
  }

  for (const term of terms) {
    if (normalizedName.includes(term)) {
      score += 60;
    }

    if (normalizedTags.some((tag) => tag.includes(term))) {
      score += 40;
    }

    if (normalizedDescription.includes(term)) {
      score += 25;
    }

    if (
      normalizedDependencies.some((dependency) => dependency.includes(term))
    ) {
      score += 20;
    }

    if (normalizedHelpers.some((helper) => helper.includes(term))) {
      score += 20;
    }
  }

  return score;
};

const catalogSummaries: BitCatalogSummary[] = sharedBitInventory.map(
  (entry) => ({
    exportName: entry.exportName,
    id: entry.id,
    name: entry.name,
    description: entry.description,
    tags: [...entry.tags],
    duration: entry.duration,
    width: "width" in entry ? entry.width : undefined,
    height: "height" in entry ? entry.height : undefined,
    sourcePath: entry.sourcePath,
    componentNames: [...entry.componentNames],
    registryDependencies: [...entry.registryDependencies],
    helpers: [...entry.helpers],
  }),
);

const catalogOrder = new Map(
  catalogSummaries.map((entry, index) => [entry.id, index]),
);

export const listBitCatalog = (): BitCatalogSummary[] =>
  catalogSummaries.map((entry) => cloneSummary(entry));

export const getBitCatalogSummaries = (): BitCatalogSummary[] =>
  listBitCatalog();

export const getBitCatalogTags = (): string[] =>
  Array.from(new Set(catalogSummaries.flatMap((entry) => entry.tags))).sort(
    (left, right) => left.localeCompare(right),
  );

export const getDocsBitCatalogData = () => ({
  items: listBitCatalog(),
  tags: getBitCatalogTags(),
  total: catalogSummaries.length,
  defaultOrder: catalogSummaries.map((entry) => entry.id),
});

export const findBits = (
  options: FindBitsOptions = {},
): BitCatalogSummary[] => {
  const normalizedQuery = normalizeText(options.query ?? "");
  const normalizedTags = normalizeTags(options.tags);
  const limit = validateLimit(options.limit);

  const filteredEntries = filterByTags(catalogSummaries, normalizedTags);
  const matchedEntries = normalizedQuery
    ? filteredEntries
        .map((entry) => ({
          entry,
          score: scoreBitCatalogEntry(entry, normalizedQuery),
          order: catalogOrder.get(entry.id) ?? Number.MAX_SAFE_INTEGER,
        }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          if (left.order !== right.order) {
            return left.order - right.order;
          }

          return left.entry.id.localeCompare(right.entry.id);
        })
        .map(({ entry }) => cloneSummary(entry))
    : filteredEntries.map((entry) => cloneSummary(entry));

  return limit === undefined ? matchedEntries : matchedEntries.slice(0, limit);
};

const compactText = (value: string): string =>
  normalizeText(value).replace(/[-_\s]/g, "");

const levenshtein = (left: string, right: string): number => {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let i = 0; i < left.length; i++) {
    current[0] = i + 1;
    for (let j = 0; j < right.length; j++) {
      const cost = left[i] === right[j] ? 0 : 1;
      current[j + 1] = Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + cost,
      );
    }
    for (let j = 0; j <= right.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
};

export const suggestBitIdentifiers = (
  identifier: string,
  limit = 5,
): string[] => {
  const normalized = normalizeText(identifier);
  const compacted = compactText(identifier);
  if (!normalized) {
    return [];
  }

  const scored = catalogSummaries.map((entry) => {
    const compactId = compactText(entry.id);
    const compactName = compactText(entry.name);
    let score = scoreBitCatalogEntry(entry, normalized);

    if (compactId === compacted || compactName === compacted) {
      score += 2000;
    } else if (
      compactId.startsWith(compacted) ||
      compacted.startsWith(compactId)
    ) {
      score += 800;
    }

    const distance = Math.min(
      levenshtein(compacted, compactId),
      levenshtein(compacted, compactName),
    );
    if (distance <= 3) {
      score += Math.max(0, 40 - distance * 10);
    }

    return { id: entry.id, score, distance };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }
      return left.id.localeCompare(right.id);
    })
    .slice(0, limit)
    .map((entry) => entry.id);
};

export const formatBitSuggestions = (suggestions: string[]): string => {
  if (suggestions.length === 0) {
    return "";
  }
  return ` Did you mean: ${suggestions.join(", ")}?`;
};

export const resolveBitCatalogIdentifier = (
  identifier: string,
): BitCatalogResolution => {
  const normalizedIdentifier = normalizeText(identifier);
  const byId = catalogSummaries.find(
    (entry) => normalizeText(entry.id) === normalizedIdentifier,
  );

  if (byId) {
    return {
      entry: cloneSummary(byId),
      reason: "id",
    };
  }

  const nameMatches = catalogSummaries.filter(
    (entry) => normalizeText(entry.name) === normalizedIdentifier,
  );

  if (nameMatches.length === 1) {
    return {
      entry: cloneSummary(nameMatches[0]),
      reason: "name",
    };
  }

  if (nameMatches.length > 1) {
    return {
      entry: null,
      reason: "ambiguous-name",
      matches: nameMatches.map((entry) => entry.id),
    };
  }

  return {
    entry: null,
    reason: "not-found",
  };
};
