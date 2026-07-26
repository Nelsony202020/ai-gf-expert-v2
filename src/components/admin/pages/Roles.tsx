// Read-only documentation of the role/permission matrix (enforced in
// src/lib/db/auth.ts — this page mirrors it for admins).

import { Card, Icon } from '../ui';

const PERMISSIONS = [
  'content.view',
  'content.edit',
  'content.publish',
  'testing.edit',
  'testing.review',
  'methodology.edit',
  'seo.edit',
  'affiliates.edit',
  'redirects.edit',
  'homepage.edit',
  'users.manage',
  'settings.manage',
  'audit.view',
  'records.delete',
];

const MATRIX: Record<string, string[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS,
  editor: [
    'content.view',
    'content.edit',
    'content.publish',
    'seo.edit',
    'redirects.edit',
    'homepage.edit',
    'audit.view',
  ],
  contributor: ['content.view', 'content.edit', 'testing.edit'],
  tester: ['content.view', 'testing.edit'],
  fact_checker: ['content.view', 'testing.review', 'audit.view'],
  viewer: ['content.view'],
};

export function RolesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Roles & permissions</h2>
        <p className="text-sm text-slate-500">
          Permissions are enforced server-side on every API request. Permanent deletion is
          additionally restricted to the owner. Use <strong>contributor</strong> for testers who add
          content and run tests but cannot delete, change homepage rankings, or edit redirects.
        </p>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-2 py-2">Permission</th>
                {Object.keys(MATRIX).map((role) => (
                  <th key={role} className="px-2 py-2 text-center">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm) => (
                <tr key={perm} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 font-mono text-xs">{perm}</td>
                  {Object.keys(MATRIX).map((role) => (
                    <td key={role} className="px-2 py-1.5 text-center">
                      {MATRIX[role].includes(perm) ? (
                        <Icon name="check" className="text-green-600" />
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
