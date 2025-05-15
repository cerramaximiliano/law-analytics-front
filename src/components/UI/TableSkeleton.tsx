// material-ui
import { Skeleton, TableRow, TableCell } from "@mui/material";

interface TableSkeletonProps {
	rows?: number;
	columns: number;
}

const TableSkeleton = ({ rows = 15, columns }: TableSkeletonProps) => {
	return (
		<>
			{Array(rows)
				.fill(0)
				.map((_, rowIndex) => (
					<TableRow key={rowIndex}>
						{Array(columns)
							.fill(0)
							.map((_, cellIndex) => (
								<TableCell key={cellIndex}>
									<Skeleton width="100%" height={24} />
								</TableCell>
							))}
					</TableRow>
				))}
		</>
	);
};

export default TableSkeleton;
