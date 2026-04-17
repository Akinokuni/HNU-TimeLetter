import { create } from 'zustand';

interface AppState {
  // 信封是否已打开
  isEnvelopeOpened: boolean;
  setEnvelopeOpened: (opened: boolean) => void;

  // 信纸→地图的过渡加载状态（防止过渡期间页脚露出）
  isTransitioning: boolean;
  setTransitioning: (transitioning: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isEnvelopeOpened: false,
  setEnvelopeOpened: (opened) => set({ isEnvelopeOpened: opened }),

  isTransitioning: false,
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}));
