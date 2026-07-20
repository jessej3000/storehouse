/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'member' | 'ministers' | 'bishopric';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
}
