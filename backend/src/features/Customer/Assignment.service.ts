import createError from 'http-errors';
import { Op } from 'sequelize';
import Customer from './Customer.model';
import AssignmentHistory, { AssignmentMethod } from './AssignmentHistory.model';
import User, { UserRole, UserStatus } from '../User/User.model';
import { notify } from '../Notification/Notification.service';
import { NotificationType } from '../Notification/Notification.model';

interface AssignInput {
  customerId: string;
  assignedByUserId: string;
  method: AssignmentMethod;
  /** Required for MANUAL assignment. Ignored for the automatic strategies. */
  sellerId?: string;
  /** Optional pool restriction (e.g. a specific team) for the automatic strategies. */
  teamId?: string;
  reason?: string;
}

async function activeSellersInTeam(teamId: string): Promise<User[]> {
  return User.findAll({
    where: { teamId, role: UserRole.SALESPERSON, status: UserStatus.ACTIVE },
    order: [['createdAt', 'ASC']],
  });
}

/** Round-robin: cycles sellers in the pool based on how many customers each already has, tie-broken by seniority. */
async function pickRoundRobin(pool: User[]): Promise<User> {
  if (pool.length === 0) throw createError(422, 'No active salespeople available for round-robin assignment.');
  const counts = await Customer.findAll({
    attributes: ['assignedSellerId'],
    where: { assignedSellerId: { [Op.in]: pool.map((u) => u.id) } },
    raw: true,
  });
  const tally = new Map<string, number>(pool.map((u) => [u.id, 0]));
  for (const row of counts as unknown as { assignedSellerId: string }[]) {
    tally.set(row.assignedSellerId, (tally.get(row.assignedSellerId) || 0) + 1);
  }
  return pool.reduce((least, u) => ((tally.get(u.id) ?? 0) < (tally.get(least.id) ?? 0) ? u : least));
}

/** Workload-based: same idea as round-robin but explicitly named per spec section 27 — lowest active (non-closed) customer count wins. */
async function pickByWorkload(pool: User[]): Promise<User> {
  if (pool.length === 0) throw createError(422, 'No active salespeople available for workload-based assignment.');
  const counts = await Customer.findAll({
    attributes: ['assignedSellerId'],
    where: {
      assignedSellerId: { [Op.in]: pool.map((u) => u.id) },
      status: { [Op.notIn]: ['SOLD', 'NOT_INTERESTED', 'OPTED_OUT', 'INVALID'] },
    },
    raw: true,
  });
  const tally = new Map<string, number>(pool.map((u) => [u.id, 0]));
  for (const row of counts as unknown as { assignedSellerId: string }[]) {
    tally.set(row.assignedSellerId, (tally.get(row.assignedSellerId) || 0) + 1);
  }
  return pool.reduce((least, u) => ((tally.get(u.id) ?? 0) < (tally.get(least.id) ?? 0) ? u : least));
}

export async function assignCustomer(input: AssignInput): Promise<Customer> {
  const customer = await Customer.findByPk(input.customerId);
  if (!customer) throw createError(404, 'Customer not found.');

  let seller: User;

  switch (input.method) {
    case AssignmentMethod.MANUAL: {
      if (!input.sellerId) throw createError(400, 'sellerId is required for manual assignment.');
      const found = await User.findByPk(input.sellerId);
      if (!found || found.role !== UserRole.SALESPERSON || found.status !== UserStatus.ACTIVE) {
        throw createError(422, 'Selected seller is not an active salesperson.');
      }
      seller = found;
      break;
    }
    case AssignmentMethod.TEAM_BASED: {
      const teamId = input.teamId ?? customer.assignedTeamId;
      if (!teamId) throw createError(400, 'teamId is required for team-based assignment.');
      seller = await pickRoundRobin(await activeSellersInTeam(teamId));
      break;
    }
    case AssignmentMethod.COUNTRY_BASED: {
      if (!customer.country) throw createError(400, 'Customer has no country set for country-based assignment.');
      const pool = await User.findAll({
        where: { role: UserRole.SALESPERSON, status: UserStatus.ACTIVE },
        include: [{ association: 'team', where: { region: customer.country }, required: true }],
      });
      seller = await pickRoundRobin(pool);
      break;
    }
    case AssignmentMethod.ROUND_ROBIN: {
      const pool = input.teamId
        ? await activeSellersInTeam(input.teamId)
        : await User.findAll({ where: { role: UserRole.SALESPERSON, status: UserStatus.ACTIVE } });
      seller = await pickRoundRobin(pool);
      break;
    }
    case AssignmentMethod.WORKLOAD_BASED: {
      const pool = input.teamId
        ? await activeSellersInTeam(input.teamId)
        : await User.findAll({ where: { role: UserRole.SALESPERSON, status: UserStatus.ACTIVE } });
      seller = await pickByWorkload(pool);
      break;
    }
    default:
      throw createError(400, 'Unknown assignment method.');
  }

  const previousSellerId = customer.assignedSellerId;

  await customer.update({
    assignedSellerId: seller.id,
    assignedTeamId: seller.teamId ?? customer.assignedTeamId,
    assignedAt: new Date(),
    assignedBy: input.assignedByUserId,
  });

  await AssignmentHistory.create({
    customerId: customer.id,
    previousSellerId,
    newSellerId: seller.id,
    method: input.method,
    reason: input.reason ?? null,
    assignedBy: input.assignedByUserId,
  });

  await notify({
    userId: seller.id,
    type: previousSellerId ? NotificationType.NEW_ASSIGNMENT : NotificationType.NEW_LEAD,
    title: previousSellerId
      ? `${customer.companyName} was reassigned to you`
      : `New lead assigned: ${customer.companyName}`,
    entityType: 'Customer',
    entityId: customer.id,
  });

  return customer;
}
