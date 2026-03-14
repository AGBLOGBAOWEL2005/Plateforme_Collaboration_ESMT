import { Routes } from '@angular/router';

import { Login } from './fonctionnalites/authentification/login/login';
import { Register } from './fonctionnalites/authentification/register/register';
import { ProjetsDashboard } from './fonctionnalites/projets/projets-dashboard';
import { Kanban } from './fonctionnalites/tâches/kanban';
import { Dashboard } from './fonctionnalites/dashboard/dashboard';
import { Shell } from './layout/shell';

import { Notifications } from './fonctionnalites/communication/notifications';
import { Messagerie } from './fonctionnalites/communication/messagerie';
import { Parametres } from './fonctionnalites/utilisateur/parametres/parametres';
import { authGuard } from './core/guards/auth.guard';
import { AdminPanel } from './fonctionnalites/admin/admin-panel';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [

{path:"", redirectTo:"/dashboard", pathMatch:"full"},
{path:"login",component:Login},

{path:"register",component:Register},
{
  path:"",
  component: Shell,
  canActivate: [authGuard],
  children: [
    {path:"dashboard", component: Dashboard},
    {path:"projets", component: ProjetsDashboard},
    {path:"projets/:id", component: Kanban},
    {path:"messagerie", component: Messagerie},
    {path:"notifications", component: Notifications},
    {path:"parametres", component: Parametres},
    {path:"admin", component: AdminPanel, canActivate: [adminGuard]}
  ]
}

];
