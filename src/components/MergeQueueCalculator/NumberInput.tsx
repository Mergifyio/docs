interface Props {
	label: string;
	value: number;
	onChange: (val: number) => void;
	min?: number;
	max?: number;
}

export default function NumberInput({ label, onChange, value, min, max }: Props) {
	const handleIncrement = () => {
		onChange(value + 1 > (max ?? Infinity) ? value : value + 1);
	};

	const handleDecrement = () => {
		onChange(value - 1 < (min ?? -Infinity) ? value : value - 1);
	};

	return (
		<label
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				gap: 8,
			}}
		>
			{label}
			<div>
				<input
					type="number"
					value={value ?? ''}
					min={min}
					max={max}
					onChange={(e: any) => onChange(Number(e.target.value))}
				/>
				<div className="input-number-nav">
					<div className="input-number-button input-number-up" onClick={handleIncrement}>
						+
					</div>
					<div className="input-number-button input-number-down" onClick={handleDecrement}>
						-
					</div>
				</div>
			</div>
		</label>
	);
}
