import {
  AI_ASSISTED_TAGS,
  R18_TAGS,
  R18G_TAGS,
  UGOIRA_TAGS,
} from "../constants";
import { AiType, IllustType } from "../enums";

const checkUsingTags = (tags: string[], targetTags: string[]) => {
  for (const tag of tags) {
    if (targetTags.includes(tag.toLowerCase())) {
      return true;
    }
  }
  return false;
};

export const checkIsR18 = (tags: string[]) => {
  return checkUsingTags(tags, R18_TAGS);
};

export const checkIsR18G = (tags: string[]) => {
  return checkUsingTags(tags, R18G_TAGS);
};

export const checkIsUgoira = (illustType: IllustType) => {
  return illustType === IllustType.UGOIRA;
};

export const checkIsUgoiraUsingTags = (tags: string[]) => {
  return checkUsingTags(tags, UGOIRA_TAGS);
};

export const checkIsAiGenerated = (aiType: AiType) => {
  return aiType === AiType.AI;
};

export const checkIsAiAssisted = (tags: string[]) => {
  return checkUsingTags(tags, AI_ASSISTED_TAGS);
};
