import {
  AI_ASSISTED_TAGS,
  R18_DOWNLOAD_DIRECTORY,
  R18_TAGS,
  R18G_DOWNLOAD_DIRECTORY,
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

/**
 * 获取作品原图下载时使用的子目录。
 * R18G 作品优先归入 r18-g 目录，R18 作品归入 r18 目录，其他作品返回 `undefined`。
 */
export const getDownloadDirectory = (tags: string[]) => {
  if (checkIsR18G(tags)) return R18G_DOWNLOAD_DIRECTORY;
  if (checkIsR18(tags)) return R18_DOWNLOAD_DIRECTORY;
  return undefined;
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
