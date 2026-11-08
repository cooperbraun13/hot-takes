export interface SearchResult {
  external_id: string;
  title: string;
  year: string;
}

export interface MovieGuess {
  title: string;
  year: string | null;
}

export interface MovieCandidates {
  preferred: SearchResult[];
  other: SearchResult[];
}

export function parseMovieGuess(input: string): MovieGuess {
  const text = input.trim();
  const withYear = /^(.*?)\s*\((\d{4})\)$/.exec(text);
  return withYear?.[1].trim()
    ? { title: withYear[1].trim(), year: withYear[2] }
    : { title: text, year: null };
}

function normalize(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(the|a|an) /, "");
}

function editDistance(left: string, right: string): number {
  let row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const next = [i];
    for (let j = 1; j <= right.length; j++) {
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + Number(left[i - 1] !== right[j - 1]),
      );
    }
    row = next;
  }
  return row[right.length];
}

function matchStrength(guess: string, title: string): number {
  if (guess === title) return 3;
  if (guess.length >= 5 && title.startsWith(guess)) return 2;
  if (guess.length >= 5 && editDistance(guess, title) <= Math.max(1, Math.floor(guess.length / 8))) return 1;
  return 0;
}

export function findMovieCandidates(
  guess: MovieGuess,
  results: SearchResult[],
  rowLabel: string,
  columnLabel: string,
): MovieCandidates {
  const title = normalize(guess.title);
  const candidates = results
    .filter((movie) => !guess.year || movie.year === guess.year)
    .map((movie) => ({ movie, strength: matchStrength(title, normalize(movie.title)) }))
    .filter((candidate) => candidate.strength > 0)
    .sort((left, right) => right.strength - left.strength);
  const yearRanges = [rowLabel, columnLabel]
    .map((label) => label.match(/(\d{4})\D+(\d{4})/))
    .filter((range): range is RegExpMatchArray => range !== null);
  const matches: MovieCandidates = { preferred: [], other: [] };
  for (const { movie } of candidates) {
    const year = Number(movie.year);
    const fitsYears = yearRanges.every((range) => year >= Number(range[1]) && year <= Number(range[2]));
    matches[fitsYears ? "preferred" : "other"].push(movie);
  }
  return matches;
}

export async function firstValidMovie<T extends { correct: boolean }>(
  candidates: SearchResult[],
  check: (movie: SearchResult) => Promise<T>,
): Promise<Awaited<T> | null> {
  for (let index = 0; index < candidates.length; index += 4) {
    const results = await Promise.allSettled(candidates.slice(index, index + 4).map(check));
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.correct) return result.value;
    }
    if (results.some((result) => result.status === "rejected")) {
      throw new Error("Movie validation failed");
    }
  }
  return null;
}
