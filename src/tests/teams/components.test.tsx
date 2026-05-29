/**
 * Tests para componentes de Teams
 * Verifica RoleBadge, TeamSelector y otros componentes del sistema de equipos
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import RoleBadge from "sections/apps/teams/RoleBadge";
import TeamSelector from "sections/apps/teams/TeamSelector";
import { TeamProvider } from "contexts/TeamContext";
import { Team, TeamRole, TeamState } from "types/teams";

// Theme for MUI components
const theme = createTheme();

// Mock data
const mockOwnerUserId = "owner-123";
const mockMemberUserId = "member-456";

const mockTeam: Team = {
	_id: "team-123",
	name: "Test Team",
	description: "A test team",
	owner: mockOwnerUserId,
	ownerInfo: {
		firstName: "John",
		lastName: "Owner",
		email: "owner@test.com",
	},
	status: "active",
	members: [
		{
			_id: "member-1",
			userId: mockMemberUserId,
			email: "member@test.com",
			firstName: "Jane",
			lastName: "Member",
			role: "editor",
			status: "active",
			joinedAt: "2024-01-01T00:00:00.000Z",
		},
	],
	invitations: [],
	settings: {
		autoShareNewResources: true,
		defaultRole: "viewer",
	},
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockTeam2: Team = {
	...mockTeam,
	_id: "team-456",
	name: "Second Team",
	owner: "other-owner",
	members: [],
};

// Helper to create mock store
const createMockStore = (options: {
	teams?: Team[];
	activeTeam?: Team | null;
	currentUserRole?: "owner" | "admin" | "editor" | "viewer" | null;
	isInitialized?: boolean;
	userId?: string;
}) => {
	const { teams = [], activeTeam = null, currentUserRole = null, isInitialized = true, userId = mockOwnerUserId } = options;

	const teamsState: TeamState = {
		teams,
		activeTeam,
		currentUserRole,
		isLoading: false,
		error: null,
		isInitialized,
	};

	return configureStore({
		reducer: {
			teams: () => teamsState,
			auth: () => ({
				user: { _id: userId },
				subscription: null,
			}),
		},
		middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
	});
};

// Wrapper component for tests
const createWrapper = (store: ReturnType<typeof createMockStore>) => {
	return ({ children }: { children: React.ReactNode }) => (
		<ThemeProvider theme={theme}>
			<Provider store={store}>
				<TeamProvider>{children}</TeamProvider>
			</Provider>
		</ThemeProvider>
	);
};

// Simple wrapper without TeamProvider for RoleBadge
const SimpleWrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

describe("RoleBadge", () => {
	describe("Renderizado por Rol", () => {
		it("debe renderizar badge de owner correctamente", () => {
			render(<RoleBadge role="owner" />, { wrapper: SimpleWrapper });

			expect(screen.getByText("Propietario")).toBeInTheDocument();
		});

		it("debe renderizar badge de admin correctamente", () => {
			render(<RoleBadge role="admin" />, { wrapper: SimpleWrapper });

			expect(screen.getByText("Administrador")).toBeInTheDocument();
		});

		it("debe renderizar badge de editor correctamente", () => {
			render(<RoleBadge role="editor" />, { wrapper: SimpleWrapper });

			expect(screen.getByText("Editor")).toBeInTheDocument();
		});

		it("debe renderizar badge de viewer correctamente", () => {
			render(<RoleBadge role="viewer" />, { wrapper: SimpleWrapper });

			expect(screen.getByText("Visualizador")).toBeInTheDocument();
		});
	});

	describe("Propiedades", () => {
		it("debe aceptar tamaño small (por defecto)", () => {
			const { container } = render(<RoleBadge role="admin" size="small" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-sizeSmall");
		});

		it("debe aceptar tamaño medium", () => {
			const { container } = render(<RoleBadge role="admin" size="medium" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-sizeMedium");
		});

		it("debe aceptar variante filled (por defecto)", () => {
			const { container } = render(<RoleBadge role="admin" variant="filled" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-filled");
		});

		it("debe aceptar variante outlined", () => {
			const { container } = render(<RoleBadge role="admin" variant="outlined" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-outlined");
		});
	});

	describe("Colores por Rol", () => {
		it("owner debe tener color error", () => {
			const { container } = render(<RoleBadge role="owner" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-colorError");
		});

		it("admin debe tener color warning", () => {
			const { container } = render(<RoleBadge role="admin" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-colorWarning");
		});

		it("editor debe tener color info", () => {
			const { container } = render(<RoleBadge role="editor" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-colorInfo");
		});

		it("viewer debe tener color success", () => {
			const { container } = render(<RoleBadge role="viewer" />, {
				wrapper: SimpleWrapper,
			});

			const chip = container.querySelector(".MuiChip-root");
			expect(chip).toHaveClass("MuiChip-colorSuccess");
		});
	});

	describe("Casos Edge", () => {
		it("debe retornar null para rol inválido", () => {
			const invalidRole = "invalid" as TeamRole;
			const { container } = render(<RoleBadge role={invalidRole} />, {
				wrapper: SimpleWrapper,
			});

			expect(container.firstChild).toBeNull();
		});
	});
});

describe("TeamSelector", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	describe("Sin equipos", () => {
		it("no debe renderizar nada si no hay equipos", () => {
			const store = createMockStore({
				teams: [],
				activeTeam: null,
				isInitialized: true,
			});

			const { container } = render(<TeamSelector />, {
				wrapper: createWrapper(store),
			});

			expect(container.firstChild).toBeNull();
		});
	});

	describe("Un solo equipo", () => {
		it("debe mostrar el nombre del equipo", () => {
			const store = createMockStore({
				teams: [mockTeam],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			expect(screen.getByText("Test Team")).toBeInTheDocument();
		});

		it("debe mostrar badge de rol si showRoleBadge es true", () => {
			const store = createMockStore({
				teams: [mockTeam],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector showRoleBadge={true} />, {
				wrapper: createWrapper(store),
			});

			expect(screen.getByText("Propietario")).toBeInTheDocument();
		});

		it("no debe mostrar badge de rol si showRoleBadge es false", () => {
			const store = createMockStore({
				teams: [mockTeam],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector showRoleBadge={false} />, {
				wrapper: createWrapper(store),
			});

			expect(screen.queryByText("Propietario")).not.toBeInTheDocument();
		});

		it("no debe abrir menú al hacer clic si solo hay un equipo", async () => {
			const store = createMockStore({
				teams: [mockTeam],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			const button = screen.getByRole("button");
			await userEvent.click(button);

			// Menu should not open, so "Cambiar equipo" text should not be visible
			expect(screen.queryByText("Cambiar equipo")).not.toBeInTheDocument();
		});
	});

	describe("Múltiples equipos", () => {
		it("debe abrir menú al hacer clic", async () => {
			const store = createMockStore({
				teams: [mockTeam, mockTeam2],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			const button = screen.getByRole("button");
			await userEvent.click(button);

			// Wait for menu to open
			await waitFor(() => {
				expect(screen.getByText("Cambiar equipo")).toBeInTheDocument();
			});
		});

		it("debe mostrar todos los equipos en el menú", async () => {
			const store = createMockStore({
				teams: [mockTeam, mockTeam2],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			const button = screen.getByRole("button");
			await userEvent.click(button);

			await waitFor(() => {
				// Both team names should be visible in menu items (getAllByText because name appears in button too)
				const testTeamItems = screen.getAllByText("Test Team");
				const secondTeamItem = screen.getByText("Second Team");

				// Test Team appears twice: in button and in menu
				expect(testTeamItems.length).toBeGreaterThanOrEqual(2);
				expect(secondTeamItem).toBeInTheDocument();
			});
		});

		it("debe mostrar contador de miembros en el menú", async () => {
			const store = createMockStore({
				teams: [mockTeam, mockTeam2],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			const button = screen.getByRole("button");
			await userEvent.click(button);

			await waitFor(() => {
				// mockTeam has 1 member + owner = 2 miembros
				expect(screen.getByText("2 miembros")).toBeInTheDocument();
				// mockTeam2 has 0 members + owner = 1 miembros
				expect(screen.getByText("1 miembros")).toBeInTheDocument();
			});
		});

		it("debe cerrar el menú al hacer clic fuera", async () => {
			const store = createMockStore({
				teams: [mockTeam, mockTeam2],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			const button = screen.getByRole("button");
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText("Cambiar equipo")).toBeInTheDocument();
			});

			// Press escape to close menu
			fireEvent.keyDown(document.activeElement || document.body, {
				key: "Escape",
			});

			await waitFor(() => {
				expect(screen.queryByText("Cambiar equipo")).not.toBeInTheDocument();
			});
		});
	});

	describe("Modo compact", () => {
		it("debe aplicar estilos compactos", () => {
			const store = createMockStore({
				teams: [mockTeam],
				activeTeam: mockTeam,
				currentUserRole: "owner",
				userId: mockOwnerUserId,
			});

			render(<TeamSelector compact={true} />, { wrapper: createWrapper(store) });

			const button = screen.getByRole("button");
			expect(button).toHaveClass("MuiButton-sizeSmall");
		});
	});

	describe("Sin equipo activo", () => {
		it('debe mostrar "Seleccionar equipo" si hay múltiples equipos pero ninguno activo', async () => {
			const store = createMockStore({
				teams: [mockTeam, mockTeam2],
				activeTeam: null,
				currentUserRole: null,
				userId: mockOwnerUserId,
			});

			render(<TeamSelector />, { wrapper: createWrapper(store) });

			expect(screen.getByText("Seleccionar equipo")).toBeInTheDocument();
		});
	});
});

describe("Integración de Componentes", () => {
	it("TeamSelector debe mostrar RoleBadge con el rol correcto", () => {
		const store = createMockStore({
			teams: [mockTeam],
			activeTeam: mockTeam,
			currentUserRole: "editor",
			userId: mockMemberUserId,
		});

		render(<TeamSelector showRoleBadge={true} />, {
			wrapper: createWrapper(store),
		});

		expect(screen.getByText("Editor")).toBeInTheDocument();
	});

	it("TeamSelector debe mostrar el rol del miembro viewer", () => {
		const teamWithViewer: Team = {
			...mockTeam,
			members: [
				{
					...mockTeam.members[0],
					role: "viewer",
				},
			],
		};

		const store = createMockStore({
			teams: [teamWithViewer],
			activeTeam: teamWithViewer,
			currentUserRole: "viewer",
			userId: mockMemberUserId,
		});

		render(<TeamSelector showRoleBadge={true} />, {
			wrapper: createWrapper(store),
		});

		expect(screen.getByText("Visualizador")).toBeInTheDocument();
	});
});
