/**
 * Tests para types/teams.ts
 * Verifica las funciones helper de permisos y las constantes de roles
 */

import { describe, it, expect } from 'vitest';
import {
  canRolePerformAction,
  TEAM_PERMISSIONS,
  TEAM_ROLES,
  TEAM_ACTIONS,
  ROLE_CONFIG,
  TeamRole,
  TeamAction,
} from 'types/teams';

describe('Teams Types - Constantes', () => {
  describe('TEAM_ROLES', () => {
    it('debe contener los tres roles esperados', () => {
      expect(TEAM_ROLES).toContain('admin');
      expect(TEAM_ROLES).toContain('editor');
      expect(TEAM_ROLES).toContain('viewer');
      expect(TEAM_ROLES.length).toBe(3);
    });
  });

  describe('TEAM_ACTIONS', () => {
    it('debe contener todas las acciones esperadas', () => {
      expect(TEAM_ACTIONS).toContain('create');
      expect(TEAM_ACTIONS).toContain('read');
      expect(TEAM_ACTIONS).toContain('update');
      expect(TEAM_ACTIONS).toContain('delete');
      expect(TEAM_ACTIONS).toContain('manage_members');
      expect(TEAM_ACTIONS.length).toBe(5);
    });
  });

  describe('TEAM_PERMISSIONS', () => {
    it('admin debe tener todos los permisos', () => {
      expect(TEAM_PERMISSIONS.admin).toContain('create');
      expect(TEAM_PERMISSIONS.admin).toContain('read');
      expect(TEAM_PERMISSIONS.admin).toContain('update');
      expect(TEAM_PERMISSIONS.admin).toContain('delete');
      expect(TEAM_PERMISSIONS.admin).toContain('manage_members');
      expect(TEAM_PERMISSIONS.admin.length).toBe(5);
    });

    it('editor debe tener create, read, update', () => {
      expect(TEAM_PERMISSIONS.editor).toContain('create');
      expect(TEAM_PERMISSIONS.editor).toContain('read');
      expect(TEAM_PERMISSIONS.editor).toContain('update');
      expect(TEAM_PERMISSIONS.editor).not.toContain('delete');
      expect(TEAM_PERMISSIONS.editor).not.toContain('manage_members');
      expect(TEAM_PERMISSIONS.editor.length).toBe(3);
    });

    it('viewer solo debe tener read', () => {
      expect(TEAM_PERMISSIONS.viewer).toContain('read');
      expect(TEAM_PERMISSIONS.viewer).not.toContain('create');
      expect(TEAM_PERMISSIONS.viewer).not.toContain('update');
      expect(TEAM_PERMISSIONS.viewer).not.toContain('delete');
      expect(TEAM_PERMISSIONS.viewer).not.toContain('manage_members');
      expect(TEAM_PERMISSIONS.viewer.length).toBe(1);
    });
  });

  describe('ROLE_CONFIG', () => {
    it('debe tener configuración para todos los roles incluyendo owner', () => {
      expect(ROLE_CONFIG.owner).toBeDefined();
      expect(ROLE_CONFIG.admin).toBeDefined();
      expect(ROLE_CONFIG.editor).toBeDefined();
      expect(ROLE_CONFIG.viewer).toBeDefined();
    });

    it('owner debe tener label "Propietario" y color "error"', () => {
      expect(ROLE_CONFIG.owner.label).toBe('Propietario');
      expect(ROLE_CONFIG.owner.color).toBe('error');
    });

    it('admin debe tener label "Administrador" y color "warning"', () => {
      expect(ROLE_CONFIG.admin.label).toBe('Administrador');
      expect(ROLE_CONFIG.admin.color).toBe('warning');
    });

    it('editor debe tener label "Editor" y color "info"', () => {
      expect(ROLE_CONFIG.editor.label).toBe('Editor');
      expect(ROLE_CONFIG.editor.color).toBe('info');
    });

    it('viewer debe tener label "Visualizador" y color "success"', () => {
      expect(ROLE_CONFIG.viewer.label).toBe('Visualizador');
      expect(ROLE_CONFIG.viewer.color).toBe('success');
    });
  });
});

describe('canRolePerformAction', () => {
  describe('Owner', () => {
    it('owner puede realizar todas las acciones', () => {
      const actions: TeamAction[] = ['create', 'read', 'update', 'delete', 'manage_members'];

      actions.forEach(action => {
        expect(canRolePerformAction('owner', action)).toBe(true);
      });
    });
  });

  describe('Admin', () => {
    it('admin puede crear recursos', () => {
      expect(canRolePerformAction('admin', 'create')).toBe(true);
    });

    it('admin puede leer recursos', () => {
      expect(canRolePerformAction('admin', 'read')).toBe(true);
    });

    it('admin puede actualizar recursos', () => {
      expect(canRolePerformAction('admin', 'update')).toBe(true);
    });

    it('admin puede eliminar recursos', () => {
      expect(canRolePerformAction('admin', 'delete')).toBe(true);
    });

    it('admin puede gestionar miembros', () => {
      expect(canRolePerformAction('admin', 'manage_members')).toBe(true);
    });
  });

  describe('Editor', () => {
    it('editor puede crear recursos', () => {
      expect(canRolePerformAction('editor', 'create')).toBe(true);
    });

    it('editor puede leer recursos', () => {
      expect(canRolePerformAction('editor', 'read')).toBe(true);
    });

    it('editor puede actualizar recursos', () => {
      expect(canRolePerformAction('editor', 'update')).toBe(true);
    });

    it('editor NO puede eliminar recursos', () => {
      expect(canRolePerformAction('editor', 'delete')).toBe(false);
    });

    it('editor NO puede gestionar miembros', () => {
      expect(canRolePerformAction('editor', 'manage_members')).toBe(false);
    });
  });

  describe('Viewer', () => {
    it('viewer puede leer recursos', () => {
      expect(canRolePerformAction('viewer', 'read')).toBe(true);
    });

    it('viewer NO puede crear recursos', () => {
      expect(canRolePerformAction('viewer', 'create')).toBe(false);
    });

    it('viewer NO puede actualizar recursos', () => {
      expect(canRolePerformAction('viewer', 'update')).toBe(false);
    });

    it('viewer NO puede eliminar recursos', () => {
      expect(canRolePerformAction('viewer', 'delete')).toBe(false);
    });

    it('viewer NO puede gestionar miembros', () => {
      expect(canRolePerformAction('viewer', 'manage_members')).toBe(false);
    });
  });

  describe('Casos Edge', () => {
    it('rol inválido debería retornar false para cualquier acción', () => {
      // TypeScript previene esto, pero verificamos en runtime
      const invalidRole = 'invalid_role' as TeamRole;
      expect(canRolePerformAction(invalidRole, 'read')).toBe(false);
    });
  });
});

describe('Matriz de Permisos Completa', () => {
  const roles: Array<TeamRole | 'owner'> = ['owner', 'admin', 'editor', 'viewer'];
  const actions: TeamAction[] = ['create', 'read', 'update', 'delete', 'manage_members'];

  // Matriz esperada de permisos
  const expectedPermissions: Record<string, Record<string, boolean>> = {
    owner: { create: true, read: true, update: true, delete: true, manage_members: true },
    admin: { create: true, read: true, update: true, delete: true, manage_members: true },
    editor: { create: true, read: true, update: true, delete: false, manage_members: false },
    viewer: { create: false, read: true, update: false, delete: false, manage_members: false },
  };

  roles.forEach(role => {
    describe(`Rol: ${role}`, () => {
      actions.forEach(action => {
        const expected = expectedPermissions[role][action];
        it(`${action}: ${expected ? 'permitido' : 'denegado'}`, () => {
          expect(canRolePerformAction(role, action)).toBe(expected);
        });
      });
    });
  });
});
