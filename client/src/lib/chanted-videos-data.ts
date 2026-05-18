// فيديوهات المزامير والإصحاحات المرتلة — يُضاف إليها تدريجياً
const chanteVideos: Record<string, Record<number, string>> = {
  "المزامير": {
    91: "c273p4TaYd0",
  },
};

export function getChanteVideoId(bookName: string, chapter: number): string | null {
  return chanteVideos[bookName]?.[chapter] ?? null;
}
