import { Op } from 'sequelize';
import Customer from '../Customer/Customer.model';
import Ticket from '../Ticket/Ticket.model';
import Vehicle from '../Vehicle/Vehicle.model';
import { UserRole } from '../User/User.model';

export interface SearchResults {
  customers: { id: string; label: string; sublabel: string | null }[];
  tickets: { id: string; label: string; sublabel: string | null }[];
  vehicles: { id: string; label: string; sublabel: string | null }[];
}

interface SearchContext {
  requesterId: string;
  requesterRole: UserRole;
  requesterTeamId: string | null;
}

/**
 * Global search across Customer/Dealer, Phone, WhatsApp, Email, Company,
 * Ticket, Vehicle (spec section 43) — Conversation search is covered by
 * customer results, since every customer has at most one conversation
 * (see Conversation model) and the Inbox's own search already covers
 * that view directly.
 *
 * Respects the same row-scoping as the rest of the app: a salesperson's
 * customer/ticket results are limited to their own book, not the whole
 * company's data, even from global search.
 */
export async function globalSearch(query: string, ctx: SearchContext): Promise<SearchResults> {
  const like = { [Op.iLike]: `%${query}%` };

  const customerWhere: Record<string, unknown> = {
    [Op.or]: [
      { companyName: like },
      { contactName: like },
      { phone: like },
      { whatsappNumber: like },
      { email: like },
    ],
  };
  if (ctx.requesterRole === UserRole.SALESPERSON) {
    customerWhere.assignedSellerId = ctx.requesterId;
  } else if (ctx.requesterRole === UserRole.MANAGER) {
    customerWhere.assignedTeamId = ctx.requesterTeamId;
  }

  const ticketWhere: Record<string, unknown> = { title: like };
  if (ctx.requesterRole === UserRole.SALESPERSON) {
    ticketWhere.assignedSellerId = ctx.requesterId;
  } else if (ctx.requesterRole === UserRole.MANAGER) {
    ticketWhere.assignedTeamId = ctx.requesterTeamId;
  }

  const [customers, tickets, vehicles] = await Promise.all([
    Customer.findAll({ where: customerWhere, limit: 8 }),
    Ticket.findAll({ where: ticketWhere, limit: 8 }),
    Vehicle.findAll({
      where: { [Op.or]: [{ make: like }, { model: like }, { stockId: like }] },
      limit: 8,
    }),
  ]);

  return {
    customers: customers.map((c) => ({
      id: c.id,
      label: c.companyName,
      sublabel: c.whatsappNumber ?? c.phone,
    })),
    tickets: tickets.map((t) => ({ id: t.id, label: t.title, sublabel: t.category })),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      label: `${v.make} ${v.model} ${v.year}`,
      sublabel: v.stockId,
    })),
  };
}
