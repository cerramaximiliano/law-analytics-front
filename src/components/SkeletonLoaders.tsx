import React from "react";
import { Skeleton, Box, Card, Stack } from "@mui/material";

// Skeleton para tablas
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
	<Box>
		<Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
		{[...Array(rows)].map((_, rowIndex) => (
			<Stack key={rowIndex} direction="row" spacing={1} sx={{ mb: 1 }}>
				{[...Array(columns)].map((_, colIndex) => (
					<Skeleton
						key={colIndex}
						variant="rectangular"
						height={35}
						sx={{ flex: 1 }}
					/>
				))}
			</Stack>
		))}
	</Box>
);

// Skeleton para cards
export const CardSkeleton = () => (
	<Card sx={{ p: 2 }}>
		<Skeleton variant="rectangular" width="40%" height={20} sx={{ mb: 2 }} />
		<Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
		<Stack direction="row" spacing={1}>
			<Skeleton variant="rectangular" width="30%" height={30} />
			<Skeleton variant="rectangular" width="30%" height={30} />
		</Stack>
	</Card>
);

// Skeleton para dashboard
export const DashboardSkeleton = () => (
	<Box>
		<Stack direction="row" spacing={2} sx={{ mb: 3 }}>
			{[1, 2, 3, 4].map((i) => (
				<Box key={i} sx={{ flex: 1 }}>
					<CardSkeleton />
				</Box>
			))}
		</Stack>
		<Stack direction="row" spacing={2}>
			<Box sx={{ flex: 2 }}>
				<Card sx={{ p: 2, height: 400 }}>
					<Skeleton variant="rectangular" width="30%" height={25} sx={{ mb: 2 }} />
					<Skeleton variant="rectangular" height={320} />
				</Card>
			</Box>
			<Box sx={{ flex: 1 }}>
				<Card sx={{ p: 2, height: 400 }}>
					<Skeleton variant="rectangular" width="50%" height={25} sx={{ mb: 2 }} />
					<Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto", my: 4 }} />
				</Card>
			</Box>
		</Stack>
	</Box>
);

// Skeleton para lista de items
export const ListSkeleton = ({ items = 5 }) => (
	<Stack spacing={2}>
		{[...Array(items)].map((_, index) => (
			<Stack key={index} direction="row" spacing={2} alignItems="center">
				<Skeleton variant="circular" width={40} height={40} />
				<Box sx={{ flex: 1 }}>
					<Skeleton variant="text" width="60%" />
					<Skeleton variant="text" width="40%" />
				</Box>
				<Skeleton variant="rectangular" width={80} height={30} />
			</Stack>
		))}
	</Stack>
);

// Hook para loading con skeleton
export const useSkeletonLoader = (isLoading: boolean, SkeletonComponent: React.FC, delay = 200) => {
	const [showSkeleton, setShowSkeleton] = React.useState(false);

	React.useEffect(() => {
		let timeout: NodeJS.Timeout;
		
		if (isLoading) {
			// Mostrar skeleton después de un delay para evitar flashes
			timeout = setTimeout(() => setShowSkeleton(true), delay);
		} else {
			setShowSkeleton(false);
		}

		return () => clearTimeout(timeout);
	}, [isLoading, delay]);

	return showSkeleton ? <SkeletonComponent /> : null;
};