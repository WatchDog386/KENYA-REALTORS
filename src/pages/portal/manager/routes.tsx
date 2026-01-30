import { RouteObject } from 'react-router-dom';
import ManagerLayout from '@/components/layout/ManagerLayout';
import ManagerProperties from './Properties';
import ManagerTenants from './Tenants';
import ManagerPayments from './Payments';
import ManagerMaintenance from './Maintenance';
import ManagerApprovalRequests from './ApprovalRequests';
import ManagerVacationNotices from './VacationNotices';
import ManagerReports from './Reports';

export const managerRoutes: RouteObject[] = [
  {
    path: '/portal/manager',
    element: <ManagerLayout><div /></ManagerLayout>,
    children: [
      {
        path: 'properties',
        element: <ManagerProperties />,
      },
      {
        path: 'tenants',
        element: <ManagerTenants />,
      },
      {
        path: 'payments',
        element: <ManagerPayments />,
      },
      {
        path: 'maintenance',
        element: <ManagerMaintenance />,
      },
      {
        path: 'approval-requests',
        element: <ManagerApprovalRequests />,
      },
      {
        path: 'vacation-notices',
        element: <ManagerVacationNotices />,
      },
      {
        path: 'reports',
        element: <ManagerReports />,
      },
    ],
  },
];