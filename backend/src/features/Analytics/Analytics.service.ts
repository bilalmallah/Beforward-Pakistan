import { Op } from 'sequelize';
import Message, { MessageDirection } from '../Conversation/Message.model';
import Conversation, { ConversationStatus } from '../Conversation/Conversation.model';
import Customer, { CustomerStatus } from '../Customer/Customer.model';
import Ticket from '../Ticket/Ticket.model';
import FollowUp from '../FollowUp/FollowUp.model';
import Campaign from '../Campaign/Campaign.model';
import Vehicle, { VehicleStatus } from '../Vehicle/Vehicle.model';
import User, { UserRole } from '../User/User.model';
import Team from '../Team/Team.model';

export interface SellerAnalytics {
  sellerId: string;
  messagesSent: number;
  messagesReceived: number;
  activeConversations: number;
  leads: number;
  quotationsSent: number;
  deals: number;
  conversionRate: number;
  openFollowUps: number;
  openTickets: number;
}

/**
 * Per-salesperson metrics (spec section 45 "Salesperson" block). Deals =
 * customers this seller has moved to BOOKED or SOLD; conversion rate is
 * deals / total assigned customers, guarding against divide-by-zero.
 */
export async function getSellerAnalytics(sellerId: string): Promise<SellerAnalytics> {
  const [
    messagesSent,
    messagesReceived,
    activeConversations,
    totalCustomers,
    deals,
    quotationsSent,
    openFollowUps,
    openTickets,
  ] = await Promise.all([
    Message.count({ where: { sellerId, direction: MessageDirection.OUTBOUND } }),
    Message.count({
      where: { direction: MessageDirection.INBOUND },
      include: [{ model: Conversation, as: 'conversation', where: { assignedSellerId: sellerId }, attributes: [] }],
    }),
    Conversation.count({ where: { assignedSellerId: sellerId, status: ConversationStatus.ACTIVE } }),
    Customer.count({ where: { assignedSellerId: sellerId } }),
    Customer.count({
      where: { assignedSellerId: sellerId, status: { [Op.in]: [CustomerStatus.BOOKED, CustomerStatus.SOLD] } },
    }),
    Customer.count({ where: { assignedSellerId: sellerId, status: CustomerStatus.QUOTATION_SENT } }),
    FollowUp.count({ where: { sellerId, status: 'PENDING' } }),
    Ticket.count({ where: { assignedSellerId: sellerId, status: { [Op.notIn]: ['RESOLVED', 'CLOSED'] } } }),
  ]);

  return {
    sellerId,
    messagesSent,
    messagesReceived,
    activeConversations,
    leads: totalCustomers,
    quotationsSent,
    deals,
    conversionRate: totalCustomers > 0 ? Math.round((deals / totalCustomers) * 1000) / 10 : 0,
    openFollowUps,
    openTickets,
  };
}

export interface TeamAnalytics extends Omit<SellerAnalytics, 'sellerId'> {
  teamId: string;
  memberCount: number;
}

/** Aggregates every salesperson on a team (spec section 45 "Team" block: same metrics, summed). */
export async function getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
  const members = await User.findAll({ where: { teamId, role: UserRole.SALESPERSON } });
  const perSeller = await Promise.all(members.map((m) => getSellerAnalytics(m.id)));

  const summed = perSeller.reduce(
    (acc, s) => ({
      messagesSent: acc.messagesSent + s.messagesSent,
      messagesReceived: acc.messagesReceived + s.messagesReceived,
      activeConversations: acc.activeConversations + s.activeConversations,
      leads: acc.leads + s.leads,
      quotationsSent: acc.quotationsSent + s.quotationsSent,
      deals: acc.deals + s.deals,
      openFollowUps: acc.openFollowUps + s.openFollowUps,
      openTickets: acc.openTickets + s.openTickets,
    }),
    {
      messagesSent: 0,
      messagesReceived: 0,
      activeConversations: 0,
      leads: 0,
      quotationsSent: 0,
      deals: 0,
      openFollowUps: 0,
      openTickets: 0,
    }
  );

  return {
    teamId,
    memberCount: members.length,
    ...summed,
    conversionRate: summed.leads > 0 ? Math.round((summed.deals / summed.leads) * 1000) / 10 : 0,
  };
}

export interface CampaignAnalytics {
  campaignId: string;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
}

/** Rates computed from the Campaign model's own running counters (spec section 34). */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) return null;

  const rate = (numerator: number) =>
    campaign.sent > 0 ? Math.round((numerator / campaign.sent) * 1000) / 10 : 0;

  return {
    campaignId,
    sent: campaign.sent,
    delivered: campaign.delivered,
    read: campaign.read,
    replied: campaign.replied,
    failed: campaign.failed,
    deliveryRate: rate(campaign.delivered),
    readRate: rate(campaign.read),
    replyRate: rate(campaign.replied),
  };
}

export interface VehicleAnalytics {
  mostPromoted: { vehicleId: string; displayName: string; campaignCount: number }[];
  mostSold: number;
  totalAvailable: number;
}

/**
 * "Most requested" and "most viewed/engaged" (spec section 45) require
 * tracking this system doesn't capture yet (no per-message vehicle link,
 * no listing-page views) — reporting only what's actually measurable
 * rather than approximating, per spec section 45's own "where measurable"
 * qualifier.
 */
export async function getVehicleAnalytics(): Promise<VehicleAnalytics> {
  const campaigns = await Campaign.findAll({ where: { vehicleId: { [Op.ne]: null } } });
  const counts = new Map<string, number>();
  for (const c of campaigns) {
    if (c.vehicleId) counts.set(c.vehicleId, (counts.get(c.vehicleId) ?? 0) + 1);
  }

  const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const vehicles = await Vehicle.findAll({ where: { id: { [Op.in]: topIds.map(([id]) => id) } } });
  const mostPromoted = topIds.map(([vehicleId, campaignCount]) => {
    const v = vehicles.find((veh) => veh.id === vehicleId);
    return {
      vehicleId,
      displayName: v ? `${v.make} ${v.model} ${v.year}` : 'Unknown vehicle',
      campaignCount,
    };
  });

  const [mostSold, totalAvailable] = await Promise.all([
    Vehicle.count({ where: { status: VehicleStatus.SOLD } }),
    Vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
  ]);

  return { mostPromoted, mostSold, totalAvailable };
}

export interface DashboardSummary {
  totalCustomers: number;
  totalProspects: number;
  activeConversations: number;
  inactiveConversations: number;
  openTickets: number;
  salespeople: number;
  teams: number;
  todaysMessages: number;
  todaysReplies: number;
}

/** Admin dashboard top-line numbers (spec section 32). */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalCustomers,
    totalProspects,
    activeConversations,
    inactiveConversations,
    openTickets,
    salespeople,
    teams,
    todaysMessages,
    todaysReplies,
  ] = await Promise.all([
    Customer.count(),
    Customer.count({ where: { status: CustomerStatus.PROSPECT } }),
    Conversation.count({ where: { status: ConversationStatus.ACTIVE } }),
    Conversation.count({ where: { status: ConversationStatus.INACTIVE } }),
    Ticket.count({ where: { status: { [Op.notIn]: ['RESOLVED', 'CLOSED'] } } }),
    User.count({ where: { role: UserRole.SALESPERSON } }),
    Team.count(),
    Message.count({ where: { createdAt: { [Op.gte]: startOfDay }, direction: MessageDirection.OUTBOUND } }),
    Message.count({ where: { createdAt: { [Op.gte]: startOfDay }, direction: MessageDirection.INBOUND } }),
  ]);

  return {
    totalCustomers,
    totalProspects,
    activeConversations,
    inactiveConversations,
    openTickets,
    salespeople,
    teams,
    todaysMessages,
    todaysReplies,
  };
}
