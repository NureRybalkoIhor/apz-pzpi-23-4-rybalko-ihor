using FoodPreOrder.Application.DTOs.IoT;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FoodPreOrder.Api.Services
{
    public class IoTService
    {
        private readonly ApplicationDbContext _context;

        public IoTService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IoTDevice> RegisterDeviceAsync(CreateIoTDeviceDto dto)
        {
            var existing = await _context.IoTDevices
                .FirstOrDefaultAsync(d => d.SerialNumber == dto.SerialNumber);

            if (existing != null)
                throw new Exception($"Пристрій з серійним номером {dto.SerialNumber} вже існує!");

            var device = new IoTDevice
            {
                SerialNumber = dto.SerialNumber,
                LocationName = dto.LocationName,
                RestaurantId = dto.RestaurantId,
                IsActive = true,
                LastPing = DateTime.UtcNow
            };

            _context.IoTDevices.Add(device);
            await _context.SaveChangesAsync();
            return device;
        }

        public async Task<List<IoTDeviceDto>> GetRestaurantDevicesAsync(int restaurantId)
        {
            var devices = await _context.IoTDevices
                .Where(d => d.RestaurantId == restaurantId)
                .ToListAsync();

            return devices.Select(d => new IoTDeviceDto
            {
                Id = d.Id,
                SerialNumber = d.SerialNumber,
                LocationName = d.LocationName,
                IsActive = d.IsActive,
                LastPing = d.LastPing,
                Status = (d.LastPing.HasValue && d.LastPing.Value > DateTime.UtcNow.AddMinutes(-1))
                         ? "Online"
                         : "Offline"
            }).ToList();
        }

        public async Task<IoTDevice?> GetDeviceByIdAsync(int id)
        {
            return await _context.IoTDevices.FindAsync(id);
        }

        public async Task<bool> PingDeviceAsync(string serialNumber)
        {
            var device = await _context.IoTDevices
                .FirstOrDefaultAsync(d => d.SerialNumber == serialNumber);

            if (device == null) return false;

            device.LastPing = DateTime.UtcNow;
            device.IsActive = true;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteDeviceAsync(int id)
        {
            var device = await _context.IoTDevices.FindAsync(id);
            if (device == null) return false;

            _context.IoTDevices.Remove(device);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
