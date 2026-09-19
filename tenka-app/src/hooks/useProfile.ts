import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  NICKNAME_KEY,
  PHOTO_KEY,
  RANK_KEY,
  getRankIndex,
  setRankIndex,
} from "../data/ranks";

export function useProfile() {
  const [nickname, setNicknameRaw] = useLocalStorage<string>(NICKNAME_KEY, "");
  const [photo, setPhoto] = useLocalStorage<string>(PHOTO_KEY, "");
  const [rankIndex, setRankIndexState] = useLocalStorage<number>(
    RANK_KEY,
    getRankIndex(),
  );

  const setNickname = useCallback(
    (name: string) => {
      setNicknameRaw(name.trim().slice(0, 18));
    },
    [setNicknameRaw],
  );

  const setRank = useCallback(
    (i: number) => {
      setRankIndex(i);
      setRankIndexState(i);
    },
    [setRankIndexState],
  );

  return {
    nickname,
    setNickname,
    photo,
    setPhoto,
    rankIndex,
    setRank,
  };
}
