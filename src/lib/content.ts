import type { LocationPoint, Story } from '@/lib/types';

export const DEFAULT_AVATAR_URL = '/images/placeholders/avatar-placeholder.svg';
export const DEFAULT_SCENE_URL = '/images/placeholders/scene-placeholder.svg';

export function getStoryAvatarUrl(story?: Pick<Story, 'avatarUrl'> | null): string {
  return story?.avatarUrl?.trim() || DEFAULT_AVATAR_URL;
}

export function getStoryMainImageUrl(story?: Pick<Story, 'mainImageUrl'> | null): string {
  return story?.mainImageUrl?.trim() || DEFAULT_SCENE_URL;
}

export function getPrimaryStory(location: LocationPoint): Story | null {
  return location.stories[0] ?? null;
}

export function flattenStoriesWithLocationName(locations: LocationPoint[]): Story[] {
  return locations.flatMap((location) =>
    location.stories.map((story) => ({
      ...story,
      locationName: story.locationName ?? location.name,
    }))
  );
}
