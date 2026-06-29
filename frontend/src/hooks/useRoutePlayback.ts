import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlgorithmKey, AlgorithmTraceStep, Dataset, PathSegment, RoutePlaybackSnapshot, SolverState } from "../types/path";
import { ALGORITHM_KEYS } from "../data/algorithms";
import { edgeToCoordinates, findEdge } from "../utils/route";
import { buildPathSegments, interpolatePolylineCoordinate } from "../utils/routeAnimation";

const DEFAULT_SEGMENT_DURATION_MS = 900;
const DEFAULT_PLAYBACK_ALGORITHM: AlgorithmKey = "aStar";
const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
const EMPTY_TRACE_STEPS: AlgorithmTraceStep[] = [];
type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

type RoutePlaybackParams = {
  dataset: Dataset;
  results: SolverState;
};

type PlaybackState = {
  activeStep: number;
  segmentProgress: number;
};

function hasAnyResult(results: SolverState): boolean {
  return ALGORITHM_KEYS.some((key) => Boolean(results[key]));
}

function getPreferredAlgorithm(results: SolverState): AlgorithmKey {
  if (results.aStar) {
    return "aStar";
  }

  if (results.dijkstra) {
    return "dijkstra";
  }

  return ALGORITHM_KEYS.find((key) => Boolean(results[key])) ?? "dijkstra";
}

function getPathSignature(results: SolverState): string {
  return ALGORITHM_KEYS.map(
    (key) => `${results[key]?.path.join("-") ?? "none"}:${results[key]?.traceSteps?.length ?? 0}`
  ).join("|");
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
  const resultSignature = useMemo(() => getPathSignature(results), [results]);
  const selectedResult = results[selectedAlgorithm];
  const segments = useMemo(
    () =>
      selectedResult
        ? buildPathSegments(selectedResult.path, dataset.nodes, dataset.edges, dataset.directed)
        : [],
    [dataset.directed, dataset.edges, dataset.nodes, selectedResult]
  );
  const traceSteps = selectedResult?.traceSteps ?? EMPTY_TRACE_STEPS;
  const isTraceMode = traceSteps.length > 0;
  const segmentCount = isTraceMode ? traceSteps.length : segments.length;
  const latestStateRef = useRef(playbackState);
  const frameRef = useRef<number>();
  const lastTimestampRef = useRef<number>();

  useEffect(() => {
    latestStateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    if (!hasAnyResult(results)) {
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
    const currentTraceStep = isTraceMode && !isComplete ? traceSteps[activeStep] : undefined;
    const completedTraceSteps = isTraceMode ? traceSteps.slice(0, completedStepCount) : [];
    const currentSegment = isTraceMode
      ? buildSegmentFromTraceStep(currentTraceStep, dataset, activeStep)
      : isComplete
        ? undefined
        : segments[activeStep];
    const segmentProgress = isComplete ? 1 : playbackState.segmentProgress;
    const previousCost =
      !isTraceMode && activeStep > 0 ? segments[activeStep - 1]?.cumulativeCost ?? 0 : 0;
    const finalCost = selectedResult?.totalCost ?? segments.at(-1)?.cumulativeCost ?? 0;
    const tracedCurrentNodeMetric = currentTraceStep?.nodes.find(
      (node) => node.node === currentTraceStep.currentNode
    );
    const currentCost = currentSegment
      ? isTraceMode
        ? Number((currentSegment.cumulativeCost - currentSegment.edgeCost + currentSegment.edgeCost * segmentProgress).toFixed(2))
        : Number((previousCost + currentSegment.edgeCost * segmentProgress).toFixed(2))
      : isTraceMode
        ? currentTraceStep?.phase === "final-path" || isComplete
          ? Number(finalCost.toFixed(2))
          : tracedCurrentNodeMetric?.distance ?? tracedCurrentNodeMetric?.gCost ?? 0
        : finalCost;
    const currentNode = currentTraceStep?.currentNode;
    const currentNodeCoordinate = currentNode === undefined
      ? undefined
      : dataset.nodes.find((node) => node.id === currentNode);

    return {
      algorithm: selectedResult ? selectedAlgorithm : undefined,
      segments,
      segmentCount,
      activeStep,
      completedStepCount,
      segmentProgress,
      currentSegment,
      movingPosition: currentSegment
        ? interpolatePolylineCoordinate(currentSegment.coordinates, segmentProgress)
        : currentNodeCoordinate
          ? [currentNodeCoordinate.lat, currentNodeCoordinate.lng]
          : segments.at(-1)?.toCoordinate,
      currentCost,
      isComplete,
      traceSteps,
      currentTraceStep,
      completedTraceSteps,
      isTraceMode,
    };
  }, [
    dataset,
    isTraceMode,
    playbackState.activeStep,
    playbackState.segmentProgress,
    segmentCount,
    segments,
    selectedAlgorithm,
    selectedResult,
    traceSteps,
  ]);

  return {
    availableAlgorithms: ALGORITHM_KEYS.reduce(
      (accumulator, key) => {
        accumulator[key] = Boolean(results[key]);
        return accumulator;
      },
      {} as Record<AlgorithmKey, boolean>
    ),
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

function buildSegmentFromTraceStep(
  traceStep: RoutePlaybackSnapshot["currentTraceStep"],
  dataset: Dataset,
  stepIndex: number
): PathSegment | undefined {
  if (!traceStep?.relaxedEdge) {
    return undefined;
  }

  const { from, to, weight, cumulativeCost } = traceStep.relaxedEdge;
  const fromNode = dataset.nodes.find((node) => node.id === from);
  const toNode = dataset.nodes.find((node) => node.id === to);
  const edge = findEdge(from, to, dataset.edges, dataset.directed);

  if (!fromNode || !toNode) {
    return undefined;
  }

  const fromCoordinate: [number, number] = [fromNode.lat, fromNode.lng];
  const toCoordinate: [number, number] = [toNode.lat, toNode.lng];
  const coordinates = edge
    ? edgeToCoordinates(edge, dataset.nodes, dataset.directed, from, to)
    : [fromCoordinate, toCoordinate];

  return {
    stepIndex,
    from,
    to,
    fromCoordinate,
    toCoordinate,
    coordinates: coordinates.length >= 2 ? coordinates : [fromCoordinate, toCoordinate],
    edgeCost: weight,
    cumulativeCost,
  };
}
