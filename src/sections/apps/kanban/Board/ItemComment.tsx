// material-ui
import { useTheme } from "@mui/material/styles";
import { Grid, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import Dot from "components/@extended/Dot";
import Avatar from "components/@extended/Avatar";

// types
import { ThemeMode } from "types/config";
import { KanbanComment, KanbanProfile } from "types/kanban";

interface Props {
	comment: KanbanComment;
	profile: KanbanProfile;
}

const avatarImage = require.context("assets/images/users", true);

// ==============================|| KANBAN BOARD - ITEM COMMENT ||============================== //

const ItemComment = ({ comment, profile }: Props) => {
	const theme = useTheme();

	return (
		<MainCard
			content={false}
			sx={{
				background: theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[100] : theme.palette.secondary.lighter,
				p: 1.5,
				mt: 1.25,
			}}
		>
			<Grid container spacing={1}>
				<Grid item xs={12}>
					<Grid container wrap="nowrap" alignItems="center" spacing={1}>
						<Grid item>
							<Avatar
								sx={{ width: 24, height: 24 }}
								size="sm"
								alt="User 1"
								src={profile && profile.avatar && avatarImage(`./${profile.avatar}`)}
							/>
						</Grid>
						<Grid item xs zeroMinWidth>
							<Grid container alignItems="center" spacing={1} justifyContent="space-between">
								<Grid item>
									<Typography align="left" variant="subtitle1" component="div">
										{profile.name}
									</Typography>
								</Grid>
								<Grid item>
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<Dot size={6} sx={{ mt: -0.25 }} color="secondary" />
										<Typography variant="caption" color="secondary">
											{profile.time}
										</Typography>
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12} sx={{ "&.MuiGrid-root": { pt: 1.5 } }}>
					<Typography align="left" variant="body2">
						{comment?.comment}
					</Typography>
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default ItemComment;
