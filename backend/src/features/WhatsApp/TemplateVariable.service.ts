import createError from 'http-errors';
import Customer from '../Customer/Customer.model.js';
import User from '../User/User.model.js';
import Vehicle from '../Vehicle/Vehicle.model.js';

/**
 * The full set of variables the system knows how to resolve. A template's
 * `variables` list may only reference names from this set — anything else
 * is rejected up front rather than silently sent blank (spec section 15).
 */
const KNOWN_VARIABLES = new Set([
  'customer_name',
  'dealer_name',
  'salesperson_name',
  'vehicle_name',
  'vehicle_year',
  'vehicle_mileage',
  'vehicle_price',
  'vehicle_url',
]);

export interface VariableContext {
  customer: Customer;
  seller: User | null;
  vehicle: Vehicle | null;
}

export function assertVariablesAreKnown(variables: string[]): void {
  const unknown = variables.filter((v) => !KNOWN_VARIABLES.has(v));
  if (unknown.length > 0) {
    throw createError(
      400,
      `Template references unsupported variable(s): ${unknown.join(', ')}. Supported variables: ${[...KNOWN_VARIABLES].join(', ')}.`
    );
  }
}

/**
 * Resolves every variable a template declares against the given context.
 * Throws rather than sending a template with a blank/unresolved field —
 * e.g. a template that references vehicle_price with no vehicle selected
 * is a 400, not a message sent with an empty price (spec section 15).
 */
export function resolveVariables(
  declaredVariables: string[],
  context: VariableContext
): Record<string, string> {
  const resolved: Record<string, string> = {};
  const unresolved: string[] = [];

  for (const name of declaredVariables) {
    const value = resolveOne(name, context);
    if (value === null) {
      unresolved.push(name);
    } else {
      resolved[name] = value;
    }
  }

  if (unresolved.length > 0) {
    throw createError(
      400,
      `Cannot send template — the following variable(s) could not be resolved: ${unresolved.join(', ')}. ` +
        (unresolved.some((v) => v.startsWith('vehicle_'))
          ? 'A vehicle must be selected for templates that reference vehicle details.'
          : '')
    );
  }

  return resolved;
}

function resolveOne(name: string, context: VariableContext): string | null {
  switch (name) {
    case 'customer_name':
      return context.customer.contactName || context.customer.companyName;
    case 'dealer_name':
      return context.customer.companyName;
    case 'salesperson_name':
      return context.seller?.fullName ?? null;
    case 'vehicle_name':
      return context.vehicle ? `${context.vehicle.make} ${context.vehicle.model} ${context.vehicle.year}` : null;
    case 'vehicle_year':
      return context.vehicle ? String(context.vehicle.year) : null;
    case 'vehicle_mileage':
      return context.vehicle ? `${context.vehicle.mileage.toLocaleString()} KM` : null;
    case 'vehicle_price':
      return context.vehicle
        ? `${context.vehicle.currency} ${Number(context.vehicle.price).toLocaleString()}`
        : null;
    case 'vehicle_url':
      // No public vehicle listing page exists yet (would be built alongside
      // a customer-facing site, outside this CRM's scope so far) — left
      // unresolved on purpose rather than fabricating a URL.
      return null;
    default:
      return null;
  }
}

/** Renders a template body with {{variable}} placeholders replaced, for local preview/storage. */
export function renderBody(body: string, resolved: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_match, name: string) => resolved[name] ?? `{{${name}}}`);
}
