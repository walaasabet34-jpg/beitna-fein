import type { Chapter, Character } from '../engine/types';
import ch1 from './chapters/ch1-elshanta.json';
import characters from './characters.json';

export const CHAPTERS: Record<string, Chapter> = { ch1: ch1 as unknown as Chapter };
export const FIRST_CHAPTER = 'ch1';
export const CHARACTERS = characters as Record<string, Character>;
