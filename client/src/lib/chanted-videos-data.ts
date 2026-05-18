// فيديوهات المزامير والإصحاحات المرتلة — يُضاف إليها تدريجياً
const chanteVideos: Record<string, Record<number, string>> = {
  "المزامير": {
    1:   "iUssc_nQQ5s",
    2:   "mJVnJ_f91fQ",
    3:   "YvRZ8nA-y-Y",
    4:   "pzaOL5jKXHw",
    5:   "sH43R4kBe-Y",
    6:   "Ler72SI-oeo",
    7:   "eNpDwBqIDQA",
    8:   "CxIVubJkbYY",
    9:   "D_l2wiuC7uA",
    10:  "LdzQ1WbqBNE",
    11:  "PPmlKZfvjK8",
    12:  "vLH78Z588UU",
    13:  "rrsRHqaYU9Q",
    14:  "sp8FIaicYQ4",
    15:  "ea_wDkRiIig",
    20:  "qfb9Lu8yOTg",
    22:  "t1FzF_WBoxA",
    23:  "v4rgICM2964",
    24:  "OPsaXzrqmg0",
    91:  "c273p4TaYd0",
    117: "XwIEuXTFBXo",
  },
};

export function getChanteVideoId(bookName: string, chapter: number): string | null {
  return chanteVideos[bookName]?.[chapter] ?? null;
}
