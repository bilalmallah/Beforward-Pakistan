import { useEffect, useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import type { VehicleItem, VehicleStatus, Transmission, FuelType } from './vehiclesApi';
import { listVehicles, createVehicle } from './vehiclesApi';

const STATUS_TONE: Record<VehicleStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  SOLD: 'neutral',
  HIDDEN: 'danger',
};

function CreateVehicleDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [stockId, setStockId] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [price, setPrice] = useState('');
  const [transmission, setTransmission] = useState<Transmission>('AUTOMATIC');
  const [fuel, setFuel] = useState<FuelType>('PETROL');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!stockId || !make || !model || !year || !mileage || !price) {
      setError('All fields are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createVehicle({
        stockId,
        make,
        model,
        year: Number(year),
        mileage: Number(mileage),
        price: Number(price),
        transmission,
        fuel,
      });
      onCreated();
      onClose();
    } catch {
      setError('Could not create vehicle. Check the stock ID is unique.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-900/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">New Vehicle</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Stock ID" value={stockId} onChange={(e) => setStockId(e.target.value)} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          <Input label="Make" value={make} onChange={(e) => setMake(e.target.value)} />
          <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input label="Mileage (KM)" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          <Input label="Price (USD)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Transmission</label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value as Transmission)}
              className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Fuel</label>
            <select
              value={fuel}
              onChange={(e) => setFuel(e.target.value as FuelType)}
              className="rounded-md border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
            </select>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-danger-500">{error}</p>}
        <Button onClick={handleSubmit} isLoading={isSubmitting} className="mt-4 w-full">
          Add vehicle
        </Button>
      </Card>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function reload() {
    setIsLoading(true);
    listVehicles({ search: search || undefined })
      .then((res) => setVehicles(res.data))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(reload, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Vehicle Inventory</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Vehicle
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <Input
          placeholder="Search make, model, stock ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-300/60 bg-ink-100/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Stock ID</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Mileage</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">Loading…</td>
              </tr>
            )}
            {!isLoading && vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">No vehicles found.</td>
              </tr>
            )}
            {!isLoading &&
              vehicles.map((v) => (
                <tr key={v.id} className="border-b border-ink-300/40 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{v.stockId}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {v.make} {v.model} {v.year}
                    <div className="text-xs text-ink-500">{v.transmission} · {v.fuel}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{v.mileage.toLocaleString()} KM</td>
                  <td className="px-4 py-3 text-ink-700">
                    {v.currency} {Number(v.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[v.status]}>{v.status}</Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {showCreate && <CreateVehicleDialog onClose={() => setShowCreate(false)} onCreated={reload} />}
    </div>
  );
}
