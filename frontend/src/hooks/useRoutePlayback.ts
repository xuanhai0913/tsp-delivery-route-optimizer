import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlgorithmKey, Dataset, RoutePlaybackSnapshot, SolverState } from "../types/tsp";
import { buildRouteSegments, interpolateCoordinate } from "../utils/routeAnimation";

const DEFAULT_SEGMENT_DURATION_MS = 900;
const DEFAULT_PLAYBACK_ALGORITHM: AlgorithmKey = "branchAndBound";
const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

type RoutePlaybackParams = {
  dataset: Dataset;
  results: SolverState;
};

type PlaybackState = {
  activeStep: number;
  segmentProgress: number;
};

function getPreferredAlgorithm(results: SolverState): AlgorithmKey {
  if (results.branchAndBound) {
    return "branchAndBound";
  }

  return "greedy";
}

function getRouteSignature(results: SolverState): string {
  return [
    results.greedy?.route.join("-") ?? "none",
    results.branchAndBound?.route.join("-") ?? "none",
  ].join("|");
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);

    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function useRoutePlayback({ dataset, results }: RoutePlaybackParams) {
  const [selectedAlgorithm, setSelectedAlgorithmState] = useState<AlgorithmKey>(DEFAULT_PLAYBACK_ALGORITHM);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    activeStep: 0,
    segmentProgress: 0,
  });

  const prefersReducedMotion = usePrefersReducedMotion();
  const resultSignature = useMemo(() => getRouteSignature(results), [results]);
  const selectedResult = results[selectedAlgorithm];
  const segments = useMemo(
    () =>
      selectedResult
        ? buildRouteSegments(selectedResult.route, dataset.locations, dataset.costMatrix)
        : [],
    [dataset.costMatrix, dataset.locations, selectedResult]
  );
  const segmentCount = segments.length;
  const latestStateRef = useRef(playbackState);
  const frameRef = useRef<number>();
  const lastTimestampRef = useRef<number>();

  useEffect(() => {
    latestStateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    if (!results.greedy && !results.branchAndBound) {
      setIsPlaying(false);
      setPlaybackState({ activeStep: 0, segmentProgress: 0 });
      return;
    }

    setSelectedAlgorithmState(getPreferredAlgorithm(results));
    setIsPlaying(false);
    setPlaybackState({ activeStep: 0, segmentProgress: 0 });
  }, [dataset.id, resultSignature, results]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setPlaybackState({ activeStep: 0, segmentProgress: 0 });
  }, []);

  const setSelectedAlgorithm = useCallback(
    (algorithm: AlgorithmKey) => {
      if (!results[algorithm]) {
        return;
      }

      setSelectedAlgorithmState(algorithm);
      reset();
    },
    [reset, results]
  );

  const setPlaybackSpeed = useCallback((nextSpeed: number) => {
    if (SPEED_OPTIONS.includes(nextSpeed as PlaybackSpeed)) {
      setSpeed(nextSpeed as PlaybackSpeed);
    }
  }, []);

  const stepNext = useCallback(() => {
    setIsPlaying(false);
    setPlaybackState((current) => ({
      activeStep: Math.min(current.activeStep + 1, segmentCount),
      segmentProgress: 0,
    }));
  }, [segmentCount]);

  const stepPrevious = useCallback(() => {
    setIsPlaying(false);
    setPlaybackState((current) => ({
      activeStep: Math.max(current.activeStep - 1, 0),
      segmentProgress: 0,
    }));
  }, []);

  const play = useCallback(() => {
    if (segmentCount === 0) {
      return;
    }

    setPlaybackState((current) =>
      current.activeStep >= segmentCount
        ? { activeStep: 0, segmentProgress: 0 }
        : current
    );
    setIsPlaying(true);
  }, [segmentCount]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }

    play();
  }, [isPlaying, pause, play]);

  useEffect(() => {
    if (!isPlaying || segmentCount === 0) {
      return;
    }

    const duration = DEFAULT_SEGMENT_DURATION_MS / speed;

    const tick = (timestamp: number) => {
      const lastTimestamp = lastTimestampRef.current ?? timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestampRef.current = timestamp;

      const current = latestStateRef.current;
      const progressDelta = delta / duration;
      let nextProgress = current.segmentProgress + progressDelta;
      let nextStep = current.activeStep;

      while (nextProgress >= 1 && nextStep < segmentCount) {
        nextProgress -= 1;
        nextStep += 1;
      }

      if (nextStep >= segmentCount) {
        const completeState = { activeStep: segmentCount, segmentProgress: 1 };
        latestStateRef.current = completeState;
        setPlaybackState(completeState);
        setIsPlaying(false);
        lastTimestampRef.current = undefined;
        return;
      }

      const nextState = {
        activeStep: nextStep,
        segmentProgress: prefersReducedMotion ? 1 : nextProgress,
      };
      latestStateRef.current = nextState;
      setPlaybackState(nextState);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      lastTimestampRef.current = undefined;
    };
  }, [isPlaying, prefersReducedMotion, segmentCount, speed]);

  const snapshot = useMemo<RoutePlaybackSnapshot>(() => {
    const activeStep = Math.min(playbackState.activeStep, segmentCount);
    const isComplete = segmentCount > 0 && activeStep >= segmentCount;
    const completedStepCount = isComplete ? segmentCount : activeStep;
    const currentSegment = isComplete ? undefined : segments[activeStep];
    const segmentProgress = isComplete ? 1 : playbackState.segmentProgress;
    const previousCost =
      activeStep > 0 ? segments[activeStep - 1]?.cumulativeCost ?? 0 : 0;
    const currentCost = currentSegment
      ? Number((previousCost + currentSegment.edgeCost * segmentProgress).toFixed(2))
      : segments.at(-1)?.cumulativeCost ?? 0;

    return {
      algorithm: selectedResult ? selectedAlgorithm : undefined,
      segments,
      segmentCount,
      activeStep,
      completedStepCount,
      segmentProgress,
      currentSegment,
      movingPosition: currentSegment
        ? interpolateCoordinate(currentSegment.fromCoordinate, currentSegment.toCoordinate, segmentProgress)
        : segments.at(-1)?.toCoordinate,
      currentCost,
      isComplete,
    };
  }, [playbackState.activeStep, playbackState.segmentProgress, segmentCount, segments, selectedAlgorithm, selectedResult]);

  return {
    availableAlgorithms: {
      greedy: Boolean(results.greedy),
      branchAndBound: Boolean(results.branchAndBound),
    },
    selectedAlgorithm,
    setSelectedAlgorithm,
    isPlaying,
    speed,
    speedOptions: SPEED_OPTIONS,
    setSpeed: setPlaybackSpeed,
    snapshot,
    play,
    pause,
    togglePlay,
    reset,
    stepNext,
    stepPrevious,
  };
}
