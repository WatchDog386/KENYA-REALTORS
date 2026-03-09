// src/utils/exportGenerators.ts
import { 
  Property, 
  User, 
  ApprovalRequest,
  AnalyticsData,
  ExportOptions,
  ExportResult
} from '@/types/superAdmin';

export class ExportGenerator {
  // Export properties to CSV
  static exportPropertiesToCSV(properties: Property[]): string {
    const headers = [
      'ID',
      'Name',
      'Address',
      'City',
      'State',
      'Type',
      'Status',
      'Total Units',
      'Occupied Units',
      'Monthly Rent',
      'Manager',
      'Created At'
    ];
    
    const rows = properties.map(property => [
      property.id,
      `"${property.name.replace(/"/g, '""')}"`,
      `"${property.address.replace(/"/g, '""')}"`,
      property.city,
      property.state,
      property.type,
      property.status,
      property.total_units,
      property.occupied_units,
      property.monthly_rent,
      property.manager ? `${property.manager.first_name} ${property.manager.last_name}` : 'Unassigned',
      new Date(property.created_at).toISOString()
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Export users to CSV
  static exportUsersToCSV(users: User[]): string {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Last Login',
      'Created At'
    ];
    
    const rows = users.map(user => [
      user.id,
      `"${user.first_name.replace(/"/g, '""')}"`,
      `"${user.last_name.replace(/"/g, '""')}"`,
      user.email,
      user.phone || '',
      user.role,
      user.status,
      user.last_login_at ? new Date(user.last_login_at).toISOString() : 'Never',
      new Date(user.created_at).toISOString()
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Export approvals to CSV
  static exportApprovalsToCSV(approvals: ApprovalRequest[]): string {
    const headers = [
      'ID',
      'Title',
      'Type',
      'Status',
      'Priority',
      'Submitted By',
      'Property',
      'Description',
      'Created At',
      'Reviewed At'
    ];
    
    const rows = approvals.map(approval => [
      approval.id,
      `"${approval.title.replace(/"/g, '""')}"`,
      approval.type,
      approval.status,
      approval.priority,
      approval.submitted_by_user 
        ? `${approval.submitted_by_user.first_name} ${approval.submitted_by_user.last_name}`
        : approval.submitted_by,
      approval.property ? approval.property.name : 'N/A',
      `"${approval.description.replace(/"/g, '""')}"`,
      new Date(approval.created_at).toISOString(),
      approval.reviewed_at ? new Date(approval.reviewed_at).toISOString() : 'Pending'
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Export analytics data to CSV
  static exportAnalyticsToCSV(analytics: AnalyticsData, timeframe: string): string {
    const sections = [];
    
    // Revenue Trend
    sections.push('Revenue Trend');
    sections.push('Month,Revenue');
    analytics.revenueTrend.forEach(point => {
      sections.push(`${point.month},${point.revenue}`);
    });
    sections.push('');
    
    // Occupancy Trend
    sections.push('Occupancy Trend');
    sections.push('Month,Occupancy Rate');
    analytics.occupancyTrend.forEach(point => {
      sections.push(`${point.month},${point.occupancyRate}`);
    });
    sections.push('');
    
    // Property Type Distribution
    sections.push('Property Type Distribution');
    sections.push('Type,Count');
    analytics.propertyTypeDistribution.forEach(point => {
      sections.push(`${point.name},${point.value}`);
    });
    sections.push('');
    
    // Financial Metrics
    sections.push('Financial Metrics');
    sections.push('Metric,Value');
    sections.push(`Total Revenue,${analytics.financialMetrics.totalRevenue}`);
    sections.push(`Rent Collected,${analytics.financialMetrics.rentCollected}`);
    sections.push(`Maintenance Fees,${analytics.financialMetrics.maintenanceFees}`);
    sections.push(`Other Income,${analytics.financialMetrics.otherIncome}`);
    sections.push(`Net Income,${analytics.financialMetrics.netIncome}`);
    sections.push(`Revenue Change,${analytics.financialMetrics.revenueChange}%`);
    sections.push('');
    
    // Timeframe info
    sections.push(`Timeframe: ${timeframe}`);
    sections.push(`Generated: ${new Date().toISOString()}`);
    
    return sections.join('\n');
  }

  // Generate PDF report (simplified - returns HTML that can be converted to PDF)
  static generatePDFReport(
    data: any,
    type: 'properties' | 'users' | 'approvals' | 'analytics',
    options?: ExportOptions
  ): string {
    const title = this.getReportTitle(type, options?.timeframe);
    const timestamp = new Date().toLocaleString();
    
    let content = '';
    
    switch (type) {
      case 'properties':
        content = this.generatePropertiesPDFContent(data);
        break;
      case 'users':
        content = this.generateUsersPDFContent(data);
        break;
      case 'approvals':
        content = this.generateApprovalsPDFContent(data);
        break;
      case 'analytics':
        content = this.generateAnalyticsPDFContent(data, options?.timeframe);
        break;
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .timestamp { color: #666; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { font-weight: bold; background-color: #f9f9f9; }
          .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="timestamp">Generated: ${timestamp}</div>
        </div>
        ${content}
        <div class="footer">
          <p>Property Management System Report</p>
          <p>Confidential - For internal use only</p>
        </div>
      </body>
      </html>
    `;
  }

  private static getReportTitle(type: string, timeframe?: string): string {
    const baseTitles = {
      properties: 'Properties Report',
      users: 'User Management Report',
      approvals: 'Approval Queue Report',
      analytics: 'Analytics Dashboard Report'
    };
    
    let title = baseTitles[type as keyof typeof baseTitles] || 'Report';
    
    if (timeframe) {
      title += ` - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`;
    }
    
    return title;
  }

  private static generatePropertiesPDFContent(properties: Property[]): string {
    const totalProperties = properties.length;
    const totalRevenue = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
    const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
    
    return `
      <div class="section">
        <div class="section-title">Summary</div>
        <p>Total Properties: ${totalProperties}</p>
        <p>Total Monthly Revenue: $${totalRevenue.toLocaleString()}</p>
        <p>Occupancy Rate: ${occupancyRate.toFixed(1)}%</p>
      </div>
      
      <div class="section">
        <div class="section-title">Properties List</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Type</th>
              <th>Status</th>
              <th>Units</th>
              <th>Monthly Rent</th>
              <th>Manager</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(property => `
              <tr>
                <td>${property.name}</td>
                <td>${property.address}</td>
                <td>${property.type}</td>
                <td>${property.status}</td>
                <td>${property.occupied_units || 0}/${property.total_units || 0}</td>
                <td>$${(property.monthly_rent || 0).toLocaleString()}</td>
                <td>${property.manager ? `${property.manager.first_name} ${property.manager.last_name}` : 'Unassigned'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private static generateUsersPDFContent(users: User[]): string {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    
    // Count by role
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return `
      <div class="section">
        <div class="section-title">Summary</div>
        <p>Total Users: ${totalUsers}</p>
        <p>Active Users: ${activeUsers} (${((activeUsers / totalUsers) * 100).toFixed(1)}%)</p>
      </div>
      
      <div class="section">
        <div class="section-title">Users by Role</div>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(roleCounts).map(([role, count]) => `
              <tr>
                <td>${role.replace('_', ' ')}</td>
                <td>${count}</td>
                <td>${((count / totalUsers) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">User List</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.status}</td>
                <td>${user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private static generateApprovalsPDFContent(approvals: ApprovalRequest[]): string {
    const pending = approvals.filter(a => a.status === 'pending').length;
    const approved = approvals.filter(a => a.status === 'approved').length;
    const rejected = approvals.filter(a => a.status === 'rejected').length;
    
    return `
      <div class="section">
        <div class="section-title">Summary</div>
        <p>Total Requests: ${approvals.length}</p>
        <p>Pending: ${pending}</p>
        <p>Approved: ${approved}</p>
        <p>Rejected: ${rejected}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Approval Requests</div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Submitted By</th>
              <th>Property</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${approvals.map(approval => `
              <tr>
                <td>${approval.title}</td>
                <td>${approval.type.replace('_', ' ')}</td>
                <td>${approval.status}</td>
                <td>${approval.priority}</td>
                <td>${approval.submitted_by_user 
                  ? `${approval.submitted_by_user.first_name} ${approval.submitted_by_user.last_name}`
                  : approval.submitted_by}</td>
                <td>${approval.property ? approval.property.name : 'N/A'}</td>
                <td>${new Date(approval.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private static generateAnalyticsPDFContent(analytics: AnalyticsData, timeframe?: string): string {
    return `
      <div class="section">
        <div class="section-title">Financial Overview</div>
        <table>
          <tr>
            <td>Total Revenue:</td>
            <td>$${analytics.financialMetrics.totalRevenue.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Rent Collected:</td>
            <td>$${analytics.financialMetrics.rentCollected.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Net Income:</td>
            <td>$${analytics.financialMetrics.netIncome.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Revenue Change:</td>
            <td>${analytics.financialMetrics.revenueChange.toFixed(1)}%</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Occupancy Metrics</div>
        <table>
          <tr>
            <td>Occupancy Rate:</td>
            <td>${analytics.occupancyMetrics.occupancyRate.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Occupancy Change:</td>
            <td>${analytics.occupancyMetrics.occupancyChange.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Available Units:</td>
            <td>${analytics.occupancyMetrics.availableUnits}</td>
          </tr>
          <tr>
            <td>Occupied Units:</td>
            <td>${analytics.occupancyMetrics.occupiedUnits}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Property Type Distribution</div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.propertyTypeDistribution.map(type => `
              <tr>
                <td>${type.name}</td>
                <td>${type.value}</td>
                <td>${((type.value / analytics.propertyTypeDistribution.reduce((sum, t) => sum + t.value, 0)) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${timeframe ? `<div class="section"><p><strong>Timeframe:</strong> ${timeframe}</p></div>` : ''}
    `;
  }

  // Download generated content
  static downloadContent(content: string, filename: string, type: string = 'text/csv'): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Generate export result
  static generateExport(
    data: any,
    type: 'properties' | 'users' | 'approvals' | 'analytics',
    options: ExportOptions
  ): ExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}_report_${timestamp}.${options.format}`;
    
    let content: string;
    let contentType: string;
    
    switch (options.format) {
      case 'csv':
        contentType = 'text/csv';
        switch (type) {
          case 'properties':
            content = this.exportPropertiesToCSV(data);
            break;
          case 'users':
            content = this.exportUsersToCSV(data);
            break;
          case 'approvals':
            content = this.exportApprovalsToCSV(data);
            break;
          case 'analytics':
            content = this.exportAnalyticsToCSV(data, options.timeframe || 'month');
            break;
          default:
            throw new Error(`Unsupported export type: ${type}`);
        }
        break;
        
      case 'pdf':
        contentType = 'text/html';
        content = this.generatePDFReport(data, type, options);
        break;
        
      case 'excel':
        // For Excel, we generate CSV (can be opened in Excel)
        contentType = 'text/csv';
        switch (type) {
          case 'properties':
            content = this.exportPropertiesToCSV(data);
            break;
          case 'users':
            content = this.exportUsersToCSV(data);
            break;
          default:
            throw new Error(`Excel export not supported for type: ${type}`);
        }
        filename.replace('.csv', '.xlsx');
        break;
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    // Create download link
    this.downloadContent(content, filename, contentType);
    
    return {
      url: URL.createObjectURL(new Blob([content], { type: contentType })),
      filename,
      size: content.length,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }
}