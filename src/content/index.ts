import type { Chapter, Character } from '../engine/types';
import ch1 from './chapters/ch1-elshanta.json';
import ch2 from './chapters/ch2-elkelma.json';
import characters from './characters.json';

export const CHAPTERS: Record<string, Chapter> = {
  ch1: ch1 as unknown as Chapter,
  ch2: ch2 as unknown as Chapter,
};
/** Play order. Chapters 3–4 are added here once approved. */
export const CHAPTER_ORDER = ['ch1', 'ch2'];
export const FIRST_CHAPTER = 'ch1';
export const CHARACTERS = characters as Record<string, Character>;
