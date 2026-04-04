import { FinancialEntry } from '../../models/entry.model';

interface DateRangeFilter {
  from?: string;
  to?: string;
}

const buildDateMatch = (from?: string, to?: string) => {
  if (!from && !to) return {};
  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter['$gte'] = new Date(from);
  if (to) dateFilter['$lte'] = new Date(to + 'T23:59:59.999Z');
  return { date: dateFilter };
};

export const getSummary = async ({ from, to }: DateRangeFilter) => {
  const dateMatch = buildDateMatch(from, to);

  const result = await FinancialEntry.aggregate([
    { $match: { isDeleted: false, ...dateMatch } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = { income: 0, expense: 0, transfer: 0, netBalance: 0, totalEntries: 0 };
  result.forEach((r) => {
    if (r._id === 'income') summary.income = r.total;
    if (r._id === 'expense') summary.expense = r.total;
    if (r._id === 'transfer') summary.transfer = r.total;
    summary.totalEntries += r.count;
  });
  summary.netBalance = summary.income - summary.expense;

  return summary;
};

export const getByCategory = async ({ from, to }: DateRangeFilter) => {
  const dateMatch = buildDateMatch(from, to);

  return FinancialEntry.aggregate([
    { $match: { isDeleted: false, ...dateMatch } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        breakdown: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
            avgAmount: { $round: ['$avgAmount', 2] },
          },
        },
        categoryTotal: { $sum: '$total' },
        categoryCount: { $sum: '$count' },
      },
    },
    { $sort: { categoryTotal: -1 } },
    {
      $project: {
        category: '$_id',
        breakdown: 1,
        categoryTotal: { $round: ['$categoryTotal', 2] },
        categoryCount: 1,
        _id: 0,
      },
    },
  ]);
};

export const getByPeriod = async ({
  from,
  to,
  period = 'monthly',
}: DateRangeFilter & { period?: string }) => {
  const dateMatch = buildDateMatch(from, to);

  const groupId =
    period === 'weekly'
      ? { year: { $isoWeekYear: '$date' }, week: { $isoWeek: '$date' } }
      : period === 'daily'
      ? {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        }
      : { year: { $year: '$date' }, month: { $month: '$date' } };

  return FinancialEntry.aggregate([
    { $match: { isDeleted: false, ...dateMatch } },
    {
      $group: {
        _id: { period: groupId, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.period',
        entries: {
          $push: {
            type: '$_id.type',
            total: { $round: ['$total', 2] },
            count: '$count',
          },
        },
        periodTotal: { $sum: '$total' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    {
      $project: {
        period: '$_id',
        entries: 1,
        periodTotal: { $round: ['$periodTotal', 2] },
        _id: 0,
      },
    },
  ]);
};

export const getRecentEntries = async (limit = 10) => {
  return FinancialEntry.find({ isDeleted: false })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 50));
};
