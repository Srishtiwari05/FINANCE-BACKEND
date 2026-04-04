import { FinancialEntry } from '../../models/entry.model';
import { createError } from '../../middleware/error.middleware';
import { CreateEntryInput, UpdateEntryInput, EntryFilterInput } from './entry.schema';
import { getPaginationParams } from '../../utils/apiResponse';
import { Types } from 'mongoose';

const buildFilter = (query: EntryFilterInput, userId: string, isAnalystOrAbove: boolean) => {
  const filter: Record<string, unknown> = { isDeleted: false };

  // Viewers can only see their own entries
  if (!isAnalystOrAbove) filter['createdBy'] = new Types.ObjectId(userId);

  if (query.type) filter['type'] = query.type;
  if (query.category) filter['category'] = { $regex: query.category, $options: 'i' };
  if (query.from || query.to) {
    const dateFilter: Record<string, Date> = {};
    if (query.from) dateFilter['$gte'] = new Date(query.from);
    if (query.to) dateFilter['$lte'] = new Date(query.to + 'T23:59:59.999Z');
    filter['date'] = dateFilter;
  }
  if (query.search) {
    filter['$or'] = [
      { title: { $regex: query.search, $options: 'i' } },
      { notes: { $regex: query.search, $options: 'i' } },
      { tags: { $in: [query.search] } },
    ];
  }

  return filter;
};

export const createEntry = async (input: CreateEntryInput, userId: string) => {
  const entry = await FinancialEntry.create({ ...input, createdBy: userId, updatedBy: userId });
  return entry.populate('createdBy', 'name email role');
};

export const listEntries = async (
  query: EntryFilterInput,
  userId: string,
  isAnalystOrAbove: boolean
) => {
  const { page, limit, skip } = getPaginationParams(query as Record<string, unknown>);
  const filter = buildFilter(query, userId, isAnalystOrAbove);

  const sortField = query.sortBy || 'date';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const [entries, total] = await Promise.all([
    FinancialEntry.find(filter)
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    FinancialEntry.countDocuments(filter),
  ]);

  return { entries, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getEntryById = async (id: string, userId: string, isAnalystOrAbove: boolean) => {
  const entry = await FinancialEntry.findOne({ _id: id, isDeleted: false })
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email');

  if (!entry) throw createError('Entry not found', 404);

  // Viewers can only see their own
  if (!isAnalystOrAbove && entry.createdBy._id.toString() !== userId) {
    throw createError('Access denied: you can only view your own entries', 403);
  }

  return entry;
};

export const updateEntry = async (
  id: string,
  input: UpdateEntryInput,
  userId: string,
  isAdmin: boolean
) => {
  const entry = await FinancialEntry.findOne({ _id: id, isDeleted: false });
  if (!entry) throw createError('Entry not found', 404);

  // Analysts can only update their own entries; admins can update any
  if (!isAdmin && entry.createdBy.toString() !== userId) {
    throw createError('Access denied: you can only update your own entries', 403);
  }

  const oldData = entry.toObject();
  Object.assign(entry, input, { updatedBy: userId });
  await entry.save();

  return { entry: await entry.populate('createdBy updatedBy', 'name email'), oldData };
};

export const softDeleteEntry = async (id: string) => {
  const entry = await FinancialEntry.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!entry) throw createError('Entry not found or already deleted', 404);
  return entry;
};
