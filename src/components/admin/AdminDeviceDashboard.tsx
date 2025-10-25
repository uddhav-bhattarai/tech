'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, Plus, Eye, Search, Filter, ChevronDown, Smartphone, Monitor } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  model: string;
  slug: string;
  currentPrice?: number;
  currency: string;
  availability: string;
  createdAt: string;
  updatedAt: string;
  brand: {
    id: string;
    name: string;
    logo?: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  _count: {
    reviews: number;
    comparisons: number;
  };
}

const AdminDeviceDashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const searchQuery = search ? `?search=${encodeURIComponent(search)}` : '';
        const res = await fetch(`/api/admin/devices${searchQuery}`);
        if (!res.ok) {
          throw new Error('Failed to fetch devices');
        }
        const data = await res.json();
        setDevices(data.devices || []);
      } catch (err) {
        console.error('Failed to fetch devices:', err);
        setError('Failed to load devices');
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [search]);

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
      const res = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDevices(devices.filter(device => device.id !== deviceId));
      } else {
        alert('Failed to delete device');
      }
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('Error deleting device');
    }
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(search.toLowerCase()) ||
    device.model.toLowerCase().includes(search.toLowerCase()) ||
    device.brand.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number | undefined, currency: string) => {
    if (!price) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'NPR' ? 'USD' : currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Device Management</h1>
            <p className="text-slate-600 mt-1">Manage device specifications and content</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/devices/create" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
            <Plus className="w-5 h-5" />
            Add Device
          </Link>
          <Link href="/admin/devices/import" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all">
            <Monitor className="w-5 h-5" />
            Import Devices
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search devices by name, model, or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search className="absolute right-3 top-2.5 text-gray-400" />
        </div>
        <button className="inline-flex items-center gap-2 bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-semibold border border-slate-400 hover:bg-slate-300">
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-slate-800 mt-4">Loading devices...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-lg text-red-500">{error}</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-200 text-slate-900">
                  <th className="py-3 px-6 text-left">Device</th>
                  <th className="py-3 px-6 text-left">Brand</th>
                  <th className="py-3 px-6 text-left">Price</th>
                  <th className="py-3 px-6 text-left">Availability</th>
                  <th className="py-3 px-6 text-left">Reviews</th>
                  <th className="py-3 px-6 text-left">Updated</th>
                  <th className="py-3 px-6 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-800">
                      No devices found.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map(device => (
                    <tr key={device.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {device.images?.[0] ? (
                            <Image
                              src={device.images[0].url}
                              alt={device.images[0].alt || device.name}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <Link href={`/devices/${device.slug}`} className="font-semibold text-slate-900 hover:underline text-blue-600">
                              {device.name}
                            </Link>
                            <p className="text-sm text-slate-600">{device.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          {device.brand.logo && (
                            <Image
                              src={device.brand.logo}
                              alt={device.brand.name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                          )}
                          <span className="text-slate-800">{device.brand.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-slate-800">
                        {formatPrice(device.currentPrice, device.currency)}
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getAvailabilityColor(device.availability)}`}>
                          {device.availability}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-800">
                        <div className="text-sm">
                          <div>{device._count.reviews} reviews</div>
                          <div className="text-gray-500">{device._count.comparisons} comparisons</div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-slate-800">
                        {new Date(device.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex gap-2">
                          <Link 
                            href={`/devices/${device.slug}`} 
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" /> View
                          </Link>
                          <Link 
                            href={`/admin/devices/edit/${device.id}`} 
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                          >
                            <Pencil className="w-4 h-4" /> Edit
                          </Link>
                          <button 
                            onClick={() => handleDelete(device.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeviceDashboard;