import { RouteObject } from 'react-router-dom';
import ManagerLayout from '@/components/layout/ManagerLayout';
import ManagerProperties from './Properties';
import ManagerTenants from './Tenants';
import ManagerPayments from './Payments';
import ManagerMaintenance from './Maintenance';
import ManagerApprovalRequests from './ApprovalRequests';
import ManagerLeaveRequestsPage from './LeaveRequests';
import ManagerVacationNotices from './VacationNotices';
import ManagerReports from './Reports';
import ManagerUtilityReadings from './UtilityReadings';
import ManagerReceipts from './Receipts';
import BillingAndInvoicing from './BillingAndInvoicing';

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
        path: 'leave-requests',
        element: <ManagerLeaveRequestsPage />,
      },
      {
        path: 'vacation-notices',
        element: <ManagerVacationNotices />,
      },
      {
        path: 'reports',
        element: <ManagerReports />,
      },
      {
        path: 'utilities',
        element: <ManagerUtilityReadings />,
      },
      {
        path: 'billing',
        element: <BillingAndInvoicing />,
      },
      {
        path: 'receipts',
        element: <ManagerReceipts />,
      },
    ],
  },
];