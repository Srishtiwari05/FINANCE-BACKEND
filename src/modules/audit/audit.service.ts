import { AuditLog } from '../../models/auditLog.model';
import { getPaginationParams } from '../../utils/apiResponse';

export const listAuditLogs = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter: Record<string, unknown> = {};

  if (query['action']) filter['action'] = query['action'];
  if (query['userId']) filter['userId'] = query['userId'];
  if (query['entityType']) filter['entityType'] = query['entityType'];
  if (query['from'] || query['to']) {
    const dateFilter: Record<string, Date> = {};
    if (query['from']) dateFilter['$gte'] = new Date(query['from'] as string);
    if (query['to']) dateFilter['$lte'] = new Date((query['to'] as string) + 'T23:59:59.999Z');
    filter['createdAt'] = dateFilter;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};
