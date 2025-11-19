export interface CaptionSuggestion {
  topText: string;
  bottomText: string;
  category: 'sarcastic' | 'wholesome' | 'relatable' | 'pun' | 'dark';
}

export interface MemeState {
  topText: string;
  bottomText: string;
  topTextSize: number; // Percentage of image height (e.g. 10 = 10%)
  bottomTextSize: number;
  imageSrc: string | null; // Base64 or URL
  originalImageSrc: string | null; // To revert edits
}

export enum EditMode {
  CAPTION = 'CAPTION',
  MAGIC_EDIT = 'MAGIC_EDIT'
}

export interface ImageGenerationConfig {
  prompt: string;
  imageBase64: string;
}