import { AI_ASSISTED_TAGS } from "../constants";
import { AiType, IllustType } from "../enums";

export const checkIsR18 = (tags: string[]) => {
  const R18_TAGS = ["r-18", "r18"];
  for (const tag of tags) {
    if (R18_TAGS.includes(tag.toLowerCase())) {
      return true;
    }
  }
  return false;
};

export const checkIsUgoira = (illustType: IllustType) => {
  return illustType === IllustType.UGOIRA;
};

export const checkIsAiGenerated = (aiType: AiType) => {
  return aiType === AiType.AI;
};

export const checkIsAiAssisted = (tags: string[]) => {
  for (const tag of tags) {
    if (AI_ASSISTED_TAGS.includes(tag.toLowerCase())) {
      return true;
    }
  }
  return false;
};
