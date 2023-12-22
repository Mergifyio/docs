import { useState } from 'react';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { GoGitPullRequest } from 'react-icons/go';
import { TbPackages, TbCrystalBall } from 'react-icons/tb';
import NumberInput from './NumberInput';
import './MergeQueueCalculator.scss';
import Stat from './Stat';

function MergeQueueCalculator() {
	const [ciTime, setCiTime] = useState(30);
	const [prPerHour, setPrPerHour] = useState(10);
	const [ciUsagePct, setCiUsagePct] = useState(100);
	const [successRatio, setSuccessRatio] = useState(98);
	const [throughput, setThroughput] = useState(null);
	const [speculativeChecks, setSpeculativeChecks] = useState(null);
	const [batchSize, setBatchSize] = useState(null);
	const [latency, setLatency] = useState(null);

	const calculate = () => {
		const calculatedBatchSize = Math.ceil(100 / ciUsagePct);
		const ciTimeWithFailure = ciTime * (1 + (100 - successRatio) / 100);

		let calculatedSpeculativeChecks = prPerHour / (60 / ciTimeWithFailure) / calculatedBatchSize;

		if (calculatedBatchSize === 1) calculatedSpeculativeChecks *= ciUsagePct / 100;

		calculatedSpeculativeChecks = Math.ceil(calculatedSpeculativeChecks);

		const calculatedThroughput =
			(calculatedBatchSize * calculatedSpeculativeChecks) / (ciTime / 60);

		setSpeculativeChecks(calculatedSpeculativeChecks);
		setBatchSize(calculatedBatchSize);
		setThroughput(Math.floor(calculatedThroughput));
		setLatency(Math.ceil(Math.max(ciTimeWithFailure, 30 * (prPerHour / calculatedThroughput))));
	};

	return (
		<div
			id="calculator"
			style={{ padding: 16, border: '1px solid var(--theme-text-lighter)', borderRadius: 4 }}
		>
			<div>
				<div>
					<h2 style={{ marginBottom: '1em' }}>Merge Queue Performance Settings</h2>
					<div style={{ display: 'flex', gap: 12 }}>
						<NumberInput label="CI time in minutes:" value={ciTime} onChange={setCiTime} min={0} />
						<NumberInput
							label="Estimated CI success ratio in %:"
							value={successRatio}
							onChange={setSuccessRatio}
							min={1}
							max={100}
						/>
						<NumberInput
							label="Desired PR merges per hour:"
							value={prPerHour}
							min={1}
							onChange={setPrPerHour}
						/>
						<NumberInput
							label="Desired CI usage in %:"
							value={ciUsagePct}
							min={1}
							onChange={setCiUsagePct}
						/>
						<button
							className="button button-blue solid"
							style={{
								height: 42,
								marginTop: 'auto',
							}}
							onClick={calculate}
						>
							Calculate
						</button>
					</div>
					{throughput && (
						<div className="stats">
							<Stat
								helperText="PR tested concurrently"
								icon={TbCrystalBall}
								label="Optimal speculative checks"
								stat={speculativeChecks}
							/>
							<Stat
								icon={TbPackages}
								label="Optimal batch size"
								helperText="PR per batch"
								stat={batchSize}
							/>
							<Stat
								icon={GoGitPullRequest}
								label="Maximum throughput"
								helperText="PR merged / hour"
								stat={throughput}
							/>
							<Stat
								icon={AiOutlineClockCircle}
								label="Average latency"
								helperText="minutes before merge"
								stat={latency}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default MergeQueueCalculator;
