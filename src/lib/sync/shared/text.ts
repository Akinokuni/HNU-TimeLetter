export function mergeTextWithUrls(text: string, urls: string[]): string {
  if (urls.length === 0) return text;

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  urls.forEach((url) => {
    if (!lines.includes(url)) {
      lines.push(url);
    }
  });

  return lines.join('\n');
}

export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/\S+/g);
  return matches ? [...new Set(matches)] : [];
}
