import { useEffect, useState } from 'react';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { GoGitPullRequest } from 'react-icons/go';
import { TbClock, TbCoin, TbGauge, TbPackages, TbShieldCheck } from 'react-icons/tb';
import { TiFlowParallel } from 'react-icons/ti';
import LogSliderInput from './LogSliderInput';
import NumberInput from './NumberInput';
import SliderInput from './SliderInput';
import './MergeQueueCalculator.scss';
import Stat from './Stat';

function MergeQueueCalculator() {
  const [ciTime, setCiTime] = useState<number>(30);
  const [prPerHour, setPrPerHour] = useState<number>(10);
  const [ciUsagePct, setCiUsagePct] = useState<number>(100);
  const [successRatio, setSuccessRatio] = useState<number>(98);
  const [throughput, setThroughput] = useState<number | null>(null);
  const [speculativeChecks, setSpeculativeChecks] = useState<number | null>(null);
  const [batchSize, setBatchSize] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [reliabilityRatio, setReliabilityRatio] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ciCostPerPr, setCiCostPerPr] = useState<number | null>(null);
  const timeScaleMax = Math.max(ciCostPerPr ?? 0, ciTime ?? 0, latency ?? 0);

  useEffect(() => {
    // Validate inputs
    if (successRatio <= 0 || successRatio > 100) {
      setError('Success ratio must be between 1 and 100.');
      setThroughput(null);
      setSpeculativeChecks(null);
      setBatchSize(null);
      setLatency(null);
      setReliabilityRatio(null);
      setCiCostPerPr(null);
      return;
    }
    setError(null);

    const calculatedBatchSize = Math.ceil(100 / ciUsagePct);
    const s = Math.max(0.01, successRatio / 100); // success probability per run (guard from 0)

    // Expected time per CI run accounting for retries due to flakiness: geometric expectation 1/s
    // Base check time includes the initial batch run
    let checkTimeWithFailure = ciTime / s;

    // If batching (>1), account for expected extra bisect runs when the batch fails.
    // Expected extra runs = P(batch fails) * ceil(log2(batchSize)).
    // P(batch fails) assumes independence across PRs: 1 - s^batchSize.
    if (calculatedBatchSize > 1) {
      const steps = Math.ceil(Math.log2(calculatedBatchSize));
      const pBatchFails = 1 - Math.pow(s, calculatedBatchSize);
      const expectedExtraRuns = pBatchFails * steps;
      checkTimeWithFailure += expectedExtraRuns * (ciTime / s);
    }

    let calculatedSpeculativeChecks = prPerHour / (60 / checkTimeWithFailure) / calculatedBatchSize;
    if (calculatedBatchSize === 1) calculatedSpeculativeChecks *= ciUsagePct / 100;
    calculatedSpeculativeChecks = Math.ceil(calculatedSpeculativeChecks);

    const calculatedThroughput =
      (calculatedBatchSize * calculatedSpeculativeChecks) / (ciTime / 60);

    const reliabilityRatio = Math.pow(successRatio / 100, (calculatedBatchSize ?? 1) - 1) * 100;

    setReliabilityRatio(Math.round(reliabilityRatio));
    setSpeculativeChecks(calculatedSpeculativeChecks);
    setBatchSize(calculatedBatchSize);
    setThroughput(Math.floor(calculatedThroughput));
    setLatency(
      Math.ceil(
        Math.max(
          checkTimeWithFailure,
          calculatedThroughput > 0 ? 30 * (prPerHour / calculatedThroughput) : checkTimeWithFailure
        )
      )
    );

    // CI cost per PR (minutes/PR): time to process the batch divided by PRs in the batch
    const cost = calculatedBatchSize > 0 ? checkTimeWithFailure / calculatedBatchSize : null;
    setCiCostPerPr(cost !== null ? Math.round(cost) : null);
  }, [ciTime, prPerHour, ciUsagePct, successRatio]);

  return (
    <div
      id="calculator"
      style={{ padding: 16, border: '1px solid var(--theme-text-lighter)', borderRadius: 4 }}
    >
      <div>
        <div>
          <h3 style={{ marginBottom: '1em' }}>Merge Queue Performance Settings</h3>
          <div className="controls">
            <NumberInput label="CI time in minutes:" value={ciTime} onChange={setCiTime} min={0} />
            <SliderInput
              label="CI success ratio"
              value={successRatio}
              onChange={setSuccessRatio}
              min={1}
              max={100}
              unit="%"
              accentColor={
                successRatio < 90
                  ? '#d14343' // red
                  : successRatio < 95
                    ? '#f7c948' // yellow
                    : '#14b879' // green
              }
            />
            <NumberInput
              label="PR merges per hour:"
              value={prPerHour}
              min={1}
              onChange={setPrPerHour}
            />
            <LogSliderInput
              label="Planned CI usage"
              value={ciUsagePct}
              min={1}
              max={1000}
              onChange={setCiUsagePct}
              unit="%"
            />
          </div>
          {error && (
            <div role="alert" className="calc-error">
              {error}
            </div>
          )}
          {throughput && (
            <>
              <h4 style={{ marginTop: 16, marginBottom: 8 }}>Configuration to apply</h4>
              <div className="stats">
                <Stat
                  icon={TbPackages}
                  label="Optimal batch size"
                  helperText="per batch"
                  stat={batchSize}
                  unit="PR"
                />
                <Stat
                  helperText="run concurrently"
                  icon={TiFlowParallel}
                  label="Optimal parallel checks"
                  stat={speculativeChecks}
                  unit="checks"
                />
              </div>

              <h4 style={{ marginTop: 16, marginBottom: 8 }}>Expected performance</h4>
              <div className="stats">
                <Stat
                  icon={TbGauge}
                  label="Average throughput"
                  helperText="target"
                  stat={prPerHour}
                  unit="PR/h"
                  indicatorPct={Math.min(100, (prPerHour / (throughput || prPerHour)) * 100)}
                  indicatorColor="#3b82f6"
                />
                <Stat
                  icon={GoGitPullRequest}
                  label="Maximum throughput"
                  helperText="merged"
                  stat={throughput}
                  unit="PR/h"
                  indicatorPct={100}
                  indicatorColor="#3b82f6"
                />
                <Stat
                  icon={TbShieldCheck}
                  label="Reliability ratio"
                  helperText="probability that a batch is clean"
                  stat={reliabilityRatio}
                  unit="%"
                  indicatorPct={reliabilityRatio ?? 0}
                  indicatorColor={
                    (reliabilityRatio ?? 0) < 90
                      ? '#d14343'
                      : (reliabilityRatio ?? 0) < 95
                        ? '#f7c948'
                        : '#14b879'
                  }
                />
              </div>

              <div className="stats">
                <Stat
                  icon={TbCoin}
                  label="CI cost per PR"
                  helperText="CI time consumed"
                  stat={ciCostPerPr}
                  unit="min/PR"
                  indicatorPct={
                    timeScaleMax > 0 && ciCostPerPr != null
                      ? Math.min(100, (ciCostPerPr / timeScaleMax) * 100)
                      : 0
                  }
                  indicatorColor="#f97316"
                />
                <Stat
                  icon={TbClock}
                  label="Minimum latency"
                  helperText="best case (single run)"
                  stat={ciTime}
                  unit="min"
                  indicatorPct={timeScaleMax > 0 ? Math.min(100, (ciTime / timeScaleMax) * 100) : 0}
                  indicatorColor="#10b981"
                />
                <Stat
                  icon={AiOutlineClockCircle}
                  label="Average latency"
                  helperText="time before merge"
                  stat={latency}
                  unit="min"
                  indicatorPct={
                    timeScaleMax > 0 && latency != null
                      ? Math.min(100, (latency / timeScaleMax) * 100)
                      : 0
                  }
                  indicatorColor="#10b981"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MergeQueueCalculator;
