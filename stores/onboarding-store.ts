import { create } from "zustand";

type State = { step: number; setStep: (step: number) => void };
export const useOnboardingStore = create<State>((set) => ({ step: 0, setStep: (step) => set({ step }) }));
