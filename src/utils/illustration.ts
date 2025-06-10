import { AI_ASSISTED_TAGS } from "../constants";

export const checkIsAiAssisted = (tags: string[]) => {
  for (const tag of tags) {
    if (AI_ASSISTED_TAGS.includes(tag.toLowerCase())) {
      return true;
    }
  }
  return false;
};
