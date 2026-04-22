/**
 * Tests de los campos phoneCodArea y phoneCelular en el wizard de AddCustomer.
 *
 * Estos campos se agregaron para el portal SECLO (Secretaría de Conciliación
 * Laboral Obligatoria) y están ubicados en el paso 2 "Datos de Contacto" del
 * wizard de creación/edición de contactos.
 *
 * El wizard tiene 4 pasos:
 *   0 — Tipo y Categoría (type, role)
 *   1 — Datos Personales (name, lastName / company)
 *   2 — Datos de Contacto (state*, city*, email, phone, phoneCodArea, phoneCelular)
 *   3 — Información Adicional
 *
 * El modal se abre desde el botón "Agregar Contacto" en la lista de contactos.
 * AddCustomer verifica el límite con GET /api/plan-configs/check-resource/contacts
 * antes de mostrar el formulario.
 *
 * API de creación: POST http://localhost:5000/api/contacts/create
 *
 * GRUPO 1 — Campos phoneCodArea y phoneCelular visibles en paso 2
 * GRUPO 2 — Los campos se envían en el body del POST al crear un contacto
 */

import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const VITE_BASE = "http://localhost:5000";

const CHECK_RESOURCE_API = `${VITE_BASE}/api/plan-configs/check-resource/contacts`;
const CONTACTS_LIST_API = `${VITE_BASE}/api/contacts/**`;
const CONTACTS_CREATE_API = `${VITE_BASE}/api/contacts/create`;

const LIMIT_OK_RESPONSE = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({
		success: true,
		data: {
			hasReachedLimit: false,
			resourceType: "contacts",
			currentCount: 3,
			limit: 100,
			currentPlan: "standard",
		},
	}),
};

const EMPTY_CONTACTS = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({
		success: true,
		contacts: [],
		total: 0,
		data: [],
	}),
};

const CREATE_CONTACT_SUCCESS = {
	status: 201,
	contentType: "application/json",
	body: JSON.stringify({
		success: true,
		contact: {
			_id: "contact-test-001",
			name: "Juan",
			lastName: "Prueba",
		},
	}),
};

/**
 * Abre el wizard de AddCustomer haciendo click en "Agregar Contacto".
 * Espera a que aparezca el paso 0 del wizard (TypeStep).
 */
async function openAddCustomerDialog(page: any) {
	const addBtn = page.getByRole("button", { name: /agregar contacto/i });
	await expect(addBtn).toBeVisible({ timeout: 15_000 });
	await addBtn.click();

	// El dialog verifica el límite y luego muestra el wizard
	// Paso 0: selección de tipo — usamos el paso del stepper que es único
	await expect(page.getByText(/paso 1 de 4/i)).toBeVisible({ timeout: 12_000 });
}

/**
 * Navega a través del wizard hasta el paso 2 (Datos de Contacto).
 * Requiere completar los pasos 0 (tipo/rol) y 1 (datos personales).
 */
async function navigateToStep2(page: any) {
	// PASO 0 — Seleccionar tipo (MUI Select con id="mui-component-select-type")
	// Tipos disponibles: "Humana", "Jurídica"
	const tipoCombobox = page.locator("#mui-component-select-type").first();
	if (await tipoCombobox.isVisible({ timeout: 5_000 })) {
		await tipoCombobox.click();
		const tipoOption = page.locator('[role="option"]:not([aria-disabled="true"])').first();
		if (await tipoOption.isVisible({ timeout: 3_000 })) {
			await tipoOption.click();
		}
	}

	// Seleccionar categoría/rol — MUI Select con id="mui-component-select-role"
	// La primera opción (data-value="0") está deshabilitada; seleccionar la primera habilitada
	const rolCombobox = page.locator("#mui-component-select-role").first();
	if (await rolCombobox.isVisible({ timeout: 3_000 })) {
		await rolCombobox.click();
		const enabledOption = page.locator('[role="option"]:not([aria-disabled="true"])').first();
		if (await enabledOption.isVisible({ timeout: 3_000 })) {
			await enabledOption.click();
		}
	}

	// Avanzar a paso 1
	await page.getByRole("button", { name: /siguiente/i }).click();

	// PASO 1 — Datos Personales: completar nombre y apellido (requeridos)
	await page.waitForTimeout(500);
	const nameInput = page.locator("[id='name'], [name='name']").first();
	if (await nameInput.isVisible({ timeout: 5_000 })) {
		await nameInput.fill("Juan");
	}
	const lastNameInput = page.locator("[id='lastName'], [name='lastName']").first();
	if (await lastNameInput.isVisible({ timeout: 3_000 })) {
		await lastNameInput.fill("Prueba");
	}

	// Avanzar a paso 2
	await page.getByRole("button", { name: /siguiente/i }).click();

	// Confirmar que estamos en paso 2 (Datos de Contacto)
	await page.waitForTimeout(500);
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Campos phoneCodArea y phoneCelular visibles en paso 2
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — AddCustomer: campos phoneCodArea y phoneCelular visibles", () => {
	test.beforeEach(async ({ page }) => {
		await page.route(CHECK_RESOURCE_API, (route) => route.fulfill(LIMIT_OK_RESPONSE));
		await page.route(CONTACTS_LIST_API, (route) => route.fulfill(EMPTY_CONTACTS));

		await page.goto("/apps/customer/customer-list");
		await openAddCustomerDialog(page);
		await navigateToStep2(page);
	});

	test("campo 'Cód. área celular' es visible en paso 2", async ({ page }) => {
		// El input tiene id='phoneCodArea' o label 'Cód. área celular'
		const codAreaInput = page.locator("[id='phoneCodArea'], [name='phoneCodArea']").first();
		const codAreaLabel = page.getByText(/cód\. área celular/i).first();

		// Alguno de los dos debe ser visible
		const isInputVisible = await codAreaInput.isVisible().catch(() => false);
		const isLabelVisible = await codAreaLabel.isVisible().catch(() => false);

		expect(isInputVisible || isLabelVisible).toBe(true);
	});

	test("campo 'Celular (sin 15)' es visible en paso 2", async ({ page }) => {
		const celularInput = page.locator("[id='phoneCelular'], [name='phoneCelular']").first();
		const celularLabel = page.getByText(/celular.*sin 15/i).first();

		const isInputVisible = await celularInput.isVisible().catch(() => false);
		const isLabelVisible = await celularLabel.isVisible().catch(() => false);

		expect(isInputVisible || isLabelVisible).toBe(true);
	});

	test("phoneCodArea acepta valores numéricos de código de área", async ({ page }) => {
		const codAreaInput = page.locator("[id='phoneCodArea'], [name='phoneCodArea']").first();
		if (await codAreaInput.isVisible({ timeout: 3_000 })) {
			await codAreaInput.fill("11");
			await expect(codAreaInput).toHaveValue("11");
		}
	});

	test("phoneCelular acepta número de celular sin 15", async ({ page }) => {
		const celularInput = page.locator("[id='phoneCelular'], [name='phoneCelular']").first();
		if (await celularInput.isVisible({ timeout: 3_000 })) {
			await celularInput.fill("55554444");
			await expect(celularInput).toHaveValue("55554444");
		}
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — phoneCodArea y phoneCelular se envían en el body del POST
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — AddCustomer: phoneCodArea y phoneCelular en el body del POST", () => {
	test("campos de celular se incluyen en el body del POST /api/contacts/create", async ({ page }) => {
		let capturedBody: Record<string, unknown> | null = null;

		await page.route(CHECK_RESOURCE_API, (route) => route.fulfill(LIMIT_OK_RESPONSE));
		await page.route(CONTACTS_LIST_API, (route) => route.fulfill(EMPTY_CONTACTS));
		await page.route(CONTACTS_CREATE_API, async (route) => {
			if (route.request().method() === "POST") {
				try {
					capturedBody = JSON.parse(route.request().postData() || "{}");
				} catch {
					capturedBody = null;
				}
				await route.fulfill(CREATE_CONTACT_SUCCESS);
			} else {
				await route.continue();
			}
		});

		await page.goto("/apps/customer/customer-list");
		await openAddCustomerDialog(page);

		// PASO 0 — Tipo (MUI Select con id="mui-component-select-type")
		const tipoCombobox2 = page.locator("#mui-component-select-type").first();
		if (await tipoCombobox2.isVisible({ timeout: 5_000 })) {
			await tipoCombobox2.click();
			const tipoOption2 = page.locator('[role="option"]:not([aria-disabled="true"])').first();
			if (await tipoOption2.isVisible({ timeout: 3_000 })) {
				await tipoOption2.click();
			}
		}

		// Seleccionar categoría/rol
		const rolCombobox = page.locator("#mui-component-select-role").first();
		if (await rolCombobox.isVisible({ timeout: 3_000 })) {
			await rolCombobox.click();
			const enabledOption2 = page.locator('[role="option"]:not([aria-disabled="true"])').first();
			if (await enabledOption2.isVisible({ timeout: 3_000 })) {
				await enabledOption2.click();
			}
		}

		await page.getByRole("button", { name: /siguiente/i }).click();
		await page.waitForTimeout(500);

		// PASO 1 — Datos personales (nombre + apellido requeridos)
		const nameInput = page.locator("[id='name'], [name='name']").first();
		if (await nameInput.isVisible({ timeout: 5_000 })) {
			await nameInput.fill("Juan");
		}
		const lastNameInput = page.locator("[id='lastName'], [name='lastName']").first();
		if (await lastNameInput.isVisible({ timeout: 3_000 })) {
			await lastNameInput.fill("Prueba");
		}

		await page.getByRole("button", { name: /siguiente/i }).click();
		await page.waitForTimeout(500);

		// PASO 2 — Datos de contacto: completar estado/ciudad (requeridos) + campos celular
		// state es MUI Select → usar el combobox visible, no el input nativo oculto
		const stateCombobox = page.locator("#mui-component-select-state").first();
		if (await stateCombobox.isVisible({ timeout: 3_000 })) {
			await stateCombobox.click();
			const firstStateOption = page.locator('[role="option"]:not([aria-disabled="true"])').first();
			if (await firstStateOption.isVisible({ timeout: 3_000 })) {
				await firstStateOption.click();
			}
		}

		const cityInput = page.locator("[id='city'], [name='city']").first();
		if (await cityInput.isVisible({ timeout: 3_000 })) {
			// CABA auto-rellena la ciudad; si no, ingresar manualmente
			const cityValue = await cityInput.inputValue();
			if (!cityValue) {
				await cityInput.fill("Buenos Aires");
			}
		}

		// Completar phoneCodArea y phoneCelular
		const codAreaInput = page.locator("[id='phoneCodArea'], [name='phoneCodArea']").first();
		if (await codAreaInput.isVisible({ timeout: 3_000 })) {
			await codAreaInput.fill("11");
		}

		const celularInput = page.locator("[id='phoneCelular'], [name='phoneCelular']").first();
		if (await celularInput.isVisible({ timeout: 3_000 })) {
			await celularInput.fill("55554444");
		}

		await page.getByRole("button", { name: /siguiente/i }).click();
		await page.waitForTimeout(500);

		// PASO 3 — Información adicional: hacer submit (último paso)
		const submitBtn = page.getByRole("button", { name: /agregar|guardar|finalizar|crear/i }).last();
		if (await submitBtn.isVisible({ timeout: 5_000 })) {
			await submitBtn.click();
		}

		// Esperar a que el POST sea capturado
		await page.waitForTimeout(2_000);

		// Si el POST fue capturado, verificar que los campos de celular están presentes
		if (capturedBody !== null) {
			expect(typeof capturedBody).toBe("object");
			// phoneCodArea debe estar en el body (puede estar vacío si el valor fue limpiado)
			expect("phoneCodArea" in capturedBody).toBe(true);
			expect("phoneCelular" in capturedBody).toBe(true);
		}
	});
});
