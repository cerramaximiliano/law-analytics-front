# Implementation Notes: Hiding International Banking Data

This feature allows the application to conditionally hide international banking data based on a global setting.

## Changes Made

1. Added a global setting in `ServerContext.tsx`:

   - `HIDE_INTERNATIONAL_BANKING_DATA` flag, controlled via the `REACT_APP_HIDE_BANKING_DATA` environment variable

2. Updated auth types in `types/auth.ts`:

   - Added `hideInternationalBankingData` property to `ServerContextType`

3. Created a custom hook `useBankingDisplay.ts`:

   - Provides easy access to the banking display setting from any component
   - Returns `false` if banking data should be hidden, `true` if it should be shown

4. Modified components that display banking information:

   - `TabPayment.tsx`: Conditionally displays payment cards
   - `PaymentCard.tsx`: Shows alternative content when banking data is hidden
   - `Payment.tsx`: Conditionally renders payment forms and card details
   - `TabAccount.tsx`: Hides IP addresses and location information

5. Added localization support:
   - Added `banking_data_unavailable` key to the English locale file

## How to Use

Set the environment variable `REACT_APP_HIDE_BANKING_DATA` to "true" to enable this feature.

In components that display sensitive banking data, use the `useBankingDisplay` hook:

```typescript
import useBankingDisplay from "hooks/useBankingDisplay";

const MyComponent = () => {
	const showBankingData = useBankingDisplay();

	// Conditionally render based on the flag
	return (
		<div>
			{showBankingData ? (
				<BankingDetails /> // Show banking information
			) : (
				<RestrictedView /> // Show alternative content
			)}
		</div>
	);
};
```

## Testing

To test both scenarios:

1. Set `REACT_APP_HIDE_BANKING_DATA="false"` (or unset) to show banking data
2. Set `REACT_APP_HIDE_BANKING_DATA="true"` to hide banking data
3. Verify that sensitive information is properly hidden in the UI when the flag is set
