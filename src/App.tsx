import { useEffect, useState } from "react";

// project-imports
import Routes from "routes";
import ThemeCustomization from "themes";

import Loader from "components/Loader";
import Locales from "components/Locales";
import RTLLayout from "components/RTLLayout";
import ScrollTop from "components/ScrollTop";
// import Customization from 'components/Customization';
import Snackbar from "components/@extended/Snackbar";
import Notistack from "components/third-party/Notistack";

import { dispatch } from "store";
import { fetchMenu } from "store/reducers/menu";

import { GoogleOAuthProvider } from "@react-oauth/google";

// auth-provider
import { ServerAuthProvider as AuthProvider } from "contexts/ServerContext";
//import { JWTProvider as AuthProvider } from "contexts/JWTContext";
// import { FirebaseProvider as AuthProvider } from 'contexts/FirebaseContext';
// import { AWSCognitoProvider as AuthProvider } from 'contexts/AWSCognitoContext';
// import { Auth0Provider as AuthProvider } from 'contexts/Auth0Context';

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const googleClientId = process.env.REACT_APP_AUTH0_GOOGLE_ID;
if (!googleClientId) {
	throw new Error("REACT_APP_AUTH0_GOOGLE_ID no está definida. Asegúrate de configurarla en tu archivo .env");
}

const App = () => {
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		dispatch(fetchMenu()).then(() => {
			setLoading(false);
		});
	}, []);

	if (loading) return <Loader />;

	return (
		<ThemeCustomization>
			<RTLLayout>
				<Locales>
					<ScrollTop>
						<GoogleOAuthProvider clientId={googleClientId}>
							<AuthProvider>
								<>
									<Notistack>
										<Routes />
										{/* <Customization /> */}
										<Snackbar />
									</Notistack>
								</>
							</AuthProvider>
						</GoogleOAuthProvider>
					</ScrollTop>
				</Locales>
			</RTLLayout>
		</ThemeCustomization>
	);
};

export default App;
